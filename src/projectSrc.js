const moment = require('moment');
const db = require('../db/db');

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

    // Generate create date
    const createDate = moment().format('MM/DD/YYYY');

    // Create a user in the database
    await db.query('INSERT INTO projects(title, description, user_id, create_date) VALUES($1, $2, $3, $4)', [title, description, user.id, createDate]);

    return { message: 'Project created successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not create project';
    console.log(userMsg, error);
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
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not create project';
    console.log(userMsg, error);
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

    // Get project title, description and admin
    let projectQuery = await db.query('select title, description, user_id from projects where id=$1', [projectId]);
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
    const usersQuery = await db.query('select name, email from projects_users, users where users.id=projects_users.user_id AND project_id=$1', [projectId]);
    if (!usersQuery || !usersQuery.rows || usersQuery.rows.length <= 0) {
      projectInfo.users = [];
    } else {
      projectInfo.users = usersQuery.rows;
    }

    return projectInfo;
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get project';
    console.log(userMsg, error);
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

    // Get project admin
    let projectQuery = await db.query('select user_id from projects where id=$1', [projectId]);
    if (!projectQuery || !projectQuery.rows || projectQuery.rows.length <= 0) {
      throw { code: 404, message: 'Project is not found' };
    }
    projectQuery = projectQuery.rows[0];

    return { adminId: projectQuery };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get project admin id';
    console.log(userMsg, error);
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

    const projectAdminId = await getProjectAdminId(projectId);

    if (projectAdminId != id) {
      throw { code: 401, message: 'Only admin is authorized to delete and modiy project' };
    }

    // Delete project
    const deleteQuery = await db.query('delete from projects where id=$1 AND user_id=$2', [projectId, id]);
    if (!deleteQuery) {
      throw { code: 500, message: 'Could not delete project from database' };
    }

    return { 'message': 'Deleted project successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete project project';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

module.exports = {
  newProject,
  getProjects,
  getProject,
  deleteProject,
  getProjectAdminId
};
