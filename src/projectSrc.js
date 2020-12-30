const moment = require('moment');
const { logger } = require('./logger');
const db = require('../db/db');
const tools = require('./tools');

/**
 * Create new project
 * @param {string} title Project title
 * @param {string} description Project description
 * @param {object} user User information
 * @returns {object} newProjectResults
 * @throws {object} errorCodeAndMsg
 */
const newProject = async function newProject(title, description, user) {
  try {
    // Check if there is no email or password
    if (!title) {
      throw { code: 400, message: 'Please provide project title' };
    }

    // Get date
    const createDate = moment().format('MM/DD/YYYY');

    // Create a project in the database
    const projectQuery = await db.query('INSERT INTO projects(title, description, user_id, create_date) VALUES($1, $2, $3, $4) returning id', [title, description, user.id, createDate]);
    logger.debug({ label: 'create new project query response', results: projectQuery.rows });

    // Create a new user for the project
    const projectUserCreateDate = moment().format();
    const projectUserQuery = await db.query('insert into projects_users(user_id, project_id, added_by, create_date) values($1, $2, $3, $4) returning user_id', [user.id, projectQuery.rows[0].id, user.id, projectUserCreateDate]);
    logger.debug({ label: 'create new user project query response', results: projectUserQuery.rows });

    return { message: 'Project created successfully', id: projectQuery.rows[0].id };
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not create project or could not add user to project';
    logger.error({ userMsg, error });
    throw { code: 500, message: userMsg };
  }
};

/**
 * Get user projects
 * @param {object} user User information
 * @returns {array} projects list of projects and access level
 * @throws {object} errorCodeAndMsg
 */
const getProjects = async function getProjects(user) {
  try {
    const {
      id
    } = user;

    // Get projects from the database
    let projectsQuery = await db.query('select project_id, added_by, projects_users.create_date, title, description from projects_users, projects where projects_users.user_id=$1 AND projects_users.project_id=projects.id', [id]);
    logger.debug({ label: 'get projects query response', results: projectsQuery.rows });

    if (!projectsQuery || !projectsQuery.rows || projectsQuery.rows.length <= 0) {
      throw { code: 404, message: 'User does not have any projects' };
    }

    projectsQuery = projectsQuery.rows;

    const allProjects = projectsQuery.map((item) => {
      return {
        projectId: item.project_id,
        projectTitle: item.title,
        projectDescription: item.description,
        joinedDate: item.create_date,
        admin: id === item.added_by ? true : false
      };
    });
    return allProjects;
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not get projects';
    logger.error({ userMsg, error });
    throw { code: 500, message: userMsg };
  }
};

/**
 * Get user projects
 * @param {string} projectId Project id
 * @param {object} user User information
 * @returns {object} project
 * @throws {object} errorCodeAndMsg
 */
const getProject = async function getProject(projectId, user) {
  try {
    const {
      id
    } = user;

    if (!projectId) {
      throw { code: 400, message: 'Please provide project id' };
    }

    // Check if the user is in the project
    await tools.checkUserInProject(id, projectId);

    // Get project title, description and admin
    let projectQuery = await db.query('select title, description, user_id, create_date from projects where id=$1', [projectId]);
    logger.debug({ label: 'get project query response', results: projectQuery.rows });

    if (!projectQuery || !projectQuery.rows || projectQuery.rows.length <= 0) {
      throw { code: 404, message: 'Project is not found' };
    }
    projectQuery = projectQuery.rows[0];

    const projectInfo = {
      projectId,
      projectTitle: projectQuery.title,
      projectDescription: projectQuery.description,
      createdDate: projectQuery.create_date,
      admin: projectQuery.user_id === id ? true : false
    };

    // Get project's users
    const usersQuery = await db.query('select id, name, email from projects_users, users where users.id=projects_users.user_id AND project_id=$1', [projectId]);
    logger.debug({ label: 'get project users query response', results: usersQuery.rows });

    if (!usersQuery || !usersQuery.rows || usersQuery.rows.length <= 0) {
      projectInfo.users = [];
    } else {
      projectInfo.users = usersQuery.rows;
    }

    return projectInfo;
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not get project';
    logger.error({ userMsg, error });
    throw { code: 500, message: userMsg };
  }
};

/**
 * Get project's admin id
 * @param {string} projectId Project id
 * @returns {string} adminId
 * @throws {object} errorCodeAndMsg
 */
const getProjectAdminId = async function getProjectAdminId(projectId, user) {
  try {
    if (!projectId) {
      throw { code: 400, message: 'Please provide project id' };
    }

    const { id } = user;

    // Check if the user is in the project
    await tools.checkUserInProject(id, projectId);

    // Get project admin
    let projectQuery = await db.query('select user_id from projects where id=$1', [projectId]);
    logger.debug({ label: 'get project admin query response', results: projectQuery.rows });

    if (!projectQuery || !projectQuery.rows || projectQuery.rows.length <= 0) {
      throw { code: 404, message: 'Project is not found' };
    }
    projectQuery = projectQuery.rows[0].user_id;

    return { adminId: projectQuery };
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not get project admin id';
    logger.error({ userMsg, error });
    throw { code: 500, message: userMsg };
  }
};

/**
 * Get user projects
 * @param {string} projectId Project id
 * @param {object} user User information
 * @returns {object} project
 * @throws {object} errorCodeAndMsg
 */
const deleteProject = async function deleteProject(projectId, user) {
  try {
    const {
      id
    } = user;

    if (!projectId) {
      throw { code: 400, message: 'Please provide project id' };
    }

    const projectAdminId = await getProjectAdminId(projectId, user);

    if (projectAdminId.adminId != id) {
      throw { code: 403, message: 'Only admin is authorized to delete and modiy project' };
    }

    // Delete project and all accociated items (publications projects, search queries, users in projects)
    const deletePublicationsProject = await db.query('delete from publications_projects where project_id=$1', [projectId]);
    logger.debug({ label: 'delete project (publications projects) query response', results: deletePublicationsProject });

    const deleteSearchQueries = await db.query('delete from search_queries where project_id=$1', [projectId]);
    logger.debug({ label: 'delete project (search queries) query response', results: deleteSearchQueries });

    const deleteProjectUsers = await db.query('delete from projects_users where project_id=$1', [projectId]);
    logger.debug({ label: 'delete project (projects users) query response', results: deleteProjectUsers });

    const deleteQuery = await db.query('delete from projects where id=$1 AND user_id=$2', [projectId, id]);
    logger.debug({ label: 'delete project query response', results: deleteQuery });

    if (!deleteQuery) {
      throw { code: 500, message: 'Could not delete project from database' };
    }

    return { 'message': 'Deleted project successfully' };
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not delete project';
    logger.error({ userMsg, error });
    throw { code: 500, message: userMsg };
  }
};

/**
 * Update project title and description projects
 * @param {string} projectId Project id
 * @param {string} title Project title
 * @param {string} description Project description
 * @param {object} user User information
 * @returns {object} project
 * @throws {object} errorCodeAndMsg
 */
const updateProject = async function updateProject(projectId, title, description, user) {
  try {
    const {
      id
    } = user;

    if (!projectId || !title) {
      throw { code: 400, message: 'Please provide project id and title' };
    }

    const projectAdminId = await getProjectAdminId(projectId, user);

    if (projectAdminId.adminId != id) {
      throw { code: 403, message: 'Only admin is authorized to delete and modiy project' };
    }

    // Update project title and description
    const updateQuery = await db.query('update projects set title=$1, description=$2 where id=$3', [title, description, projectId]);
    logger.debug({ label: 'update project query response', results: updateQuery });

    if (!updateQuery) {
      throw { code: 500, message: 'Could not update project in the database' };
    }

    return { 'message': 'Updated project successfully' };
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not updated project project';
    logger.error({ userMsg, error });
    throw { code: 500, message: userMsg };
  }
};

/**
 * Add user(s) to a project
 * @param {string} projectId Project id
 * @param {array} projectUsers Users to add to the project
 * @param {object} user User information
 * @returns {object} updateResults
 * @throws {object} errorCodeAndMsg
 */
const addProjectUsers = async function addProjectUsers(projectId, projectUsers, user) {
  let insertedUsers = [];
  try {
    const {
      id
    } = user;

    if (!projectId || !projectUsers || projectUsers.length <= 0) {
      throw { code: 400, message: 'Please provide project id and users to add' };
    }

    const projectAdminId = await getProjectAdminId(projectId, user);

    if (projectAdminId.adminId != id) {
      throw { code: 403, message: 'Only admin is authorized to add users' };
    }

    // Get date
    const createDate = moment().format('MM/DD/YYYY');

    // Add users to project
    await Promise.all(projectUsers.map(async (pUserEmail) => {
      const insertQuery = await db.query('insert into projects_users values((select id from users where email=$1),$2,$3,$4) ON CONFLICT DO NOTHING', [pUserEmail, projectId, id, createDate]);
      logger.debug({ label: 'add user to project query response', results: insertQuery });
      if (insertQuery) {
        return pUserEmail;
      }
    })).then((values) => {
      insertedUsers = values;
    });

    return { 'message': 'Added all users successfully', insertedUsers };
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not add one or more users';
    logger.error(userMsg, error);
    throw { code: 500, message: userMsg, insertedUsers };
  }
};

/**
 * Remove user(s) to a project
 * @param {string} projectId Project id
 * @param {array} projectUsers Users to remove from the project
 * @param {object} user User information
 * @returns {object} updateResults
 * @throws {object} errorCodeAndMsg
 */
const removeProjectUsers = async function removeProjectUsers(projectId, projectUsers, user) {
  let deletedUsers = [];
  try {
    const {
      id,
      email
    } = user;

    if (!projectId || !projectUsers || projectUsers.length <= 0) {
      throw { code: 400, message: 'Please provide project id and users to add' };
    }

    const projectAdminId = await getProjectAdminId(projectId, user);

    if (projectAdminId.adminId != id || !(email === projectUsers[0] && projectUsers.length === 1)) {
      throw { code: 403, message: 'Only admin and self user are authorized to remove user(s)' };
    }

    // Remove user(s) from project
    await Promise.all(projectUsers.map(async (pUserEmail) => {
      const deleteQuery = await db.query('delete from projects_users where user_id=(select id from users where email=$1) AND project_id=$2', [pUserEmail, projectId]);
      logger.debug({ label: 'remove users from project query response', results: deleteQuery });

      if (deleteQuery) {
        return pUserEmail;
      }
    })).then((values) => {
      deletedUsers = values;
    });

    return { 'message': 'Delete all requested users successfully', deletedUsers };
  } catch (error) {
    if (error.code && tools.isHttpErrorCode(error.code)) {
      logger.error(error);
      throw error;
    }
    const userMsg = 'Could not delete one or more users';
    logger.error({ userMsg, error });
    throw { code: 500, message: userMsg, deletedUsers };
  }
};

module.exports = {
  newProject,
  getProjects,
  getProject,
  deleteProject,
  getProjectAdminId,
  updateProject,
  addProjectUsers,
  removeProjectUsers
};
