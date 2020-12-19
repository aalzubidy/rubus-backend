const moment = require('moment');
const Ajv = require('ajv');
const usersProjectsRequestSchema = require('../schemas/usersProjectsRequestSchema.json');
const db = require('../db/db');

/**
 * @async
 * @function newUserProjectRequest
 * @summary Create a new user project request
 * @param {object} userProjectRequest Rubus format user project request (required: "user_id", "project_id", "status", "type")
 * @param {user} user User information
 * @returns {object} newUserProjectRequestResults
 * @throws {object} errorCodeAndMsg
 */
const newUserProjectRequest = async function newUserProjectRequest(userProjectRequest, user) {
  try {
    // Check if there is no user project request
    if (!userProjectRequest) {
      throw { code: 400, message: 'Please provide a user project request' };
    }

    // Check publication object schema
    const ajv = new Ajv();
    const schemaValidation = await ajv.validate(usersProjectsRequestSchema, userProjectRequest);

    if (!schemaValidation) {
      throw { code: 400, message: 'Please provide correct user project request format, schema failed to validate.' };
    }

    // Get date
    const createDate = moment().format('MM/DD/YYYY');
    userProjectRequest['create_date'] = createDate;

    // Build dynamic insert query
    const userProjectRequestKeys = Object.keys(userProjectRequest);
    const userProjectRequestKeysCount = [];
    const userProjectRequestValues = [];
    userProjectRequestKeys.forEach((k, i) => {
      userProjectRequestKeysCount.push(`$${i + 1}`);
      userProjectRequestValues.push(userProjectRequest[k]);
    });
    const queryLine = `insert into users_projects_requests(${userProjectRequestKeys.toString()}) values(${userProjectRequestKeysCount.toString()})`;

    // Create a user project request in the database
    await db.query(queryLine, userProjectRequestValues);

    return { message: 'User project request created successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not create user project request';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function deletePublicationByDOI
 * @summary Delete publication(s) by DOI
 * @param {array} dois Publication(s) doi
 * @param {user} user User information
 * @returns {object} deletePublicationResults
 * @throws {object} errorCodeAndMsg
 */
const deletePublicationByDOI = async function deletePublicationByDOI(dois, user) {
  try {
    // Check if there is no dois
    if (!dois) {
      throw { code: 400, message: 'Please provide dois to delete' };
    }

    // Delete publication by DOI
    dois.forEach(async (doi) => {
      await db.query('delete from publications where doi=$1', [doi]);
    });

    return { message: 'Publication deleted successfully by doi' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete publication by doi';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function deletePublicationById
 * @summary Delete publication(s) by id
 * @param {array} publicationIds Publication(s) id
 * @param {user} user User information
 * @returns {object} deletePublicationResults
 * @throws {object} errorCodeAndMsg
 */
const deletePublicationById = async function deletePublicationById(publicationIds, user) {
  try {
    // Check if there is no publication ids
    if (!publicationIds) {
      throw { code: 400, message: 'Please provide publication ids to delete' };
    }

    // Delete publication by DOI
    publicationIds.forEach(async (publicationId) => {
      await db.query('delete from publications where id=$1', [publicationId]);
    });

    return { message: 'Publication deleted successfully by id' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete publication by id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function addPublicationToProjectByDoi
 * @summary Add publication(s) by DOI to a project
 * @param {array} dois Publication(s) doi
 * @param {string} projectId Project id
 * @param {string} searchQueryId Search query id
 * @param {user} user User information
 * @returns {object} addPublicationResults
 * @throws {object} errorCodeAndMsg
 */
const addPublicationToProjectByDoi = async function addPublicationToProjectByDoi(dois, projectId, searchQueryId, user) {
  try {
    // Check if there is no dois or no project id
    if (!dois || !projectId) {
      throw { code: 400, message: 'Please provide dois and a project id' };
    }

    const {
      id
    } = user;

    // Check the user permission to manipulate project's publication
    const queryProjectUsers = await db.query('select user_id, project_id from projects_users where user_id=$1 and project_id=$2', [id, projectId]);
    if (!queryProjectUsers || !queryProjectUsers.rows[0] || queryProjectUsers.rows[0]['user_id'] != id || queryProjectUsers.rows[0]['project_id'] != projectId) {
      throw { code: 403, message: 'User does not have permissions to modify project\'s publications' };
    }

    const successItems = [];
    const failedItems = [];

    // Retreive publication by id and add it to a project
    dois.forEach(async (doi) => {
      let queryPublicationId = await db.query('select id from publications where doi=$1', [doi]);
      if (queryPublicationId && queryPublicationId.rows[0]) {
        queryPublicationId = queryPublicationId.rows[0];
        await db.query('insert into publications_projects(publication_id, project_id, search_query_id) values($1, $2, $3)', [queryPublicationId, projectId, searchQueryId]);
        successItems.push(doi);
      } else {
        failedItems.push(doi);
      }
    });

    return { message: 'Publication added to project successfully by doi', successItems, failedItems };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not add publications to a project by doi';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function addPublicationToProjectById
 * @summary Add publication(s) by id to a project
 * @param {array} publicationIds Publication(s) id
 * @param {string} projectId Project id
 * @param {string} searchQueryId Search query id
 * @param {user} user User information
 * @returns {object} addPublicationResults
 * @throws {object} errorCodeAndMsg
 */
const addPublicationToProjectById = async function addPublicationToProjectById(publicationIds, projectId, searchQueryId, user) {
  try {
    // Check if there is no dois or no project id
    if (!publicationIds || !projectId) {
      throw { code: 400, message: 'Please provide publication ids and a project id' };
    }

    const {
      id
    } = user;

    // Check the user permission to manipulate project's publication
    const queryProjectUsers = await db.query('select user_id, project_id from projects_users where user_id=$1 and project_id=$2', [id, projectId]);
    if (!queryProjectUsers || !queryProjectUsers.rows[0] || queryProjectUsers.rows[0]['user_id'] != id || queryProjectUsers.rows[0]['project_id'] != projectId) {
      throw { code: 403, message: 'User does not have permissions to modify project\'s publications' };
    }

    const successItems = [];
    const failedItems = [];

    // Retreive publication by id and add it to a project
    publicationIds.forEach(async (publicationId) => {
      const addPublicationQuery = await db.query('insert into publications_projects(publication_id, project_id, search_query_id) values($1, $2, $3)', [publicationId, projectId, searchQueryId]);
      if (addPublicationQuery) {
        successItems.push(publicationId);
      } else {
        failedItems.push(publicationId);
      }
    });

    return { message: 'Publication added to project successfully by id', successItems, failedItems };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not add publications to a project by id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function deletePublicationFromProjectByDoi
 * @summary Delete publication(s) by DOI from a project
 * @param {array} dois Publication(s) doi
 * @param {string} projectId Project id
 * @param {user} user User information
 * @returns {object} deletePublicationResults
 * @throws {object} errorCodeAndMsg
 */
const deletePublicationFromProjectByDoi = async function deletePublicationFromProjectByDoi(dois, projectId, user) {
  try {
    // Check if there is no dois or no project id
    if (!dois || !projectId) {
      throw { code: 400, message: 'Please provide dois and a project id' };
    }

    const {
      id
    } = user;

    // Check the user permission to manipulate project's publication
    const queryProjectUsers = await db.query('select user_id, project_id from projects_users where user_id=$1 and project_id=$2', [id, projectId]);
    if (!queryProjectUsers || !queryProjectUsers.rows[0] || queryProjectUsers.rows[0]['user_id'] != id || queryProjectUsers.rows[0]['project_id'] != projectId) {
      throw { code: 403, message: 'User does not have permissions to modify project\'s publications' };
    }

    const successItems = [];
    const failedItems = [];

    // Retreive publication by id and delete it from a project
    dois.forEach(async (doi) => {
      let queryPublicationId = await db.query('select id from publications where doi=$1', [doi]);
      if (queryPublicationId && queryPublicationId.rows[0]) {
        queryPublicationId = queryPublicationId.rows[0];
        await db.query('delete from publications_projects where publication_id=$1 and project_id=$2', [queryPublicationId, projectId]);
        successItems.push(doi);
      } else {
        failedItems.push(doi);
      }
    });

    return { message: 'Publication deleted to project successfully by doi', successItems, failedItems };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete publications from a project by doi';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function deletePublicationFromProjectById
 * @summary Delete publication(s) by id from a project
 * @param {array} publicationIds Publication(s) id
 * @param {string} projectId Project id
 * @param {user} user User information
 * @returns {object} deletePublicationResults
 * @throws {object} errorCodeAndMsg
 */
const deletePublicationFromProjectById = async function deletePublicationFromProjectById(publicationIds, projectId, user) {
  try {
    // Check if there is no publication id or no project id
    if (!publicationIds || !projectId) {
      throw { code: 400, message: 'Please provide publication ids and a project id' };
    }

    const {
      id
    } = user;

    // Check the user permission to manipulate project's publication
    const queryProjectUsers = await db.query('select user_id, project_id from projects_users where user_id=$1 and project_id=$2', [id, projectId]);
    if (!queryProjectUsers || !queryProjectUsers.rows[0] || queryProjectUsers.rows[0]['user_id'] != id || queryProjectUsers.rows[0]['project_id'] != projectId) {
      throw { code: 403, message: 'User does not have permissions to modify project\'s publications' };
    }

    const successItems = [];
    const failedItems = [];

    // Delete publication from project by id
    publicationIds.forEach(async (publicationId) => {
      const deletePublicationQuery = await db.query('delete from publications_projects where publication_id=$1 and project_id=$2', [publicationId, projectId]);
      if (deletePublicationQuery) {
        successItems.push(publicationId);
      } else {
        failedItems.push(publicationId);
      }
    });

    return { message: 'Publication deleted to project successfully by id', successItems, failedItems };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete publications from a project by id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function deleteAllPublicationsFromProject
 * @summary Delete all publication(s) from a project
 * @param {string} projectId Project id
 * @param {user} user User information
 * @returns {object} deletePublicationResults
 * @throws {object} errorCodeAndMsg
 */
const deleteAllPublicationsFromProject = async function deleteAllPublicationsFromProject(projectId, user) {
  try {
    // Check if there is no project id
    if (!projectId) {
      throw { code: 400, message: 'Please provide a project id' };
    }

    const {
      id
    } = user;

    // Check the user permission to manipulate project's publication
    const queryProjectUsers = await db.query('select user_id, project_id from projects_users where user_id=$1 and project_id=$2', [id, projectId]);
    if (!queryProjectUsers || !queryProjectUsers.rows[0] || queryProjectUsers.rows[0]['user_id'] != id || queryProjectUsers.rows[0]['project_id'] != projectId) {
      throw { code: 403, message: 'User does not have permissions to modify project\'s publications' };
    }

    // Delete all publications from a project
    const deletePublicationQuery = await db.query('delete from publications_projects where project_id=$1', [projectId]);
    if (deletePublicationQuery) {
      return { message: 'All publication were deleted from a project successfully' };
    } else {
      throw { code: 500, message: 'Could not delete publications from a project' };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete all publications from a project';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

module.exports = {
  newUserProjectRequest,
  deletePublicationByDOI,
  deletePublicationById,
  addPublicationToProjectByDoi,
  addPublicationToProjectById,
  deletePublicationFromProjectByDoi,
  deletePublicationFromProjectById,
  deleteAllPublicationsFromProject
};
