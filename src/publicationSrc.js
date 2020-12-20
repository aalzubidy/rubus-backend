const moment = require('moment');
const Ajv = require('ajv');
const publicationSchema = require('../schemas/publicationSchema.json');
const db = require('../db/db');

/**
 * @async
 * @function newPublication
 * @summary Create a new publication
 * @param {object} publication Rubus format publication (required: "type", "author", "title", "doi", "url")
 * @param {user} user User information
 * @returns {object} newPublicationResults
 * @throws {object} errorCodeAndMsg
 */
const newPublication = async function newPublication(publication, user) {
  try {
    // Check if there is no publication
    if (!publication) {
      throw { code: 400, message: 'Please provide a publication' };
    }

    // Check publication object schema
    const ajv = new Ajv();
    const schemaValidation = await ajv.validate(publicationSchema, publication);

    if (!schemaValidation) {
      throw { code: 400, message: 'Please provide correct publication format, schema failed to validate.' };
    }

    // Get date
    const createDate = moment().format('MM/DD/YYYY');
    publication['create_date'] = createDate;

    // Build dynamic insert query
    const publicationKeys = Object.keys(publication);
    const publicationKeysCount = [];
    const publicationValues = [];
    publicationKeys.forEach((k, i) => {
      publicationKeysCount.push(`$${i + 1}`);
      publicationValues.push(publication[k]);
    });
    const queryLine = `insert into publications(${publicationKeys.toString()}) values(${publicationKeysCount.toString()})`;

    // Create a publication in the database
    await db.query(queryLine, publicationValues);

    return { message: 'Publication created successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not create publication';
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
      const addPublicationQuery = await db.query('insert into publications_projects(publication_id, project_id, search_query_id) values($1, $2, $3) ON CONFLICT DO NOTHING', [publicationId, projectId, searchQueryId]);
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

/**
 * @async
 * @function getPublicationById
 * @summary Get publication by id
 * @param {number} publicationId Publication id
 * @param {user} user User information
 * @returns {object} publicationResults
 * @throws {object} errorCodeAndMsg
 */
const getPublicationById = async function getPublicationById(publicationId, user) {
  try {
    // Check if there is no publication id
    if (!publicationId) {
      throw { code: 400, message: 'Please provide a publication id' };
    }

    // Get publication by id
    const publicationQuery = await db.query('select * from publications where id=$1', [publicationId]);
    if (publicationQuery && publicationQuery.rows && publicationQuery.rows[0]) {
      return publicationQuery.rows[0];
    } else {
      throw { code: 500, message: 'Could not find publication by id' };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get publication by id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function getPublicationByDOI
 * @summary Get publication by doi
 * @param {string} publicationDoi Publication doi
 * @param {user} user User information
 * @returns {object} publicationResults
 * @throws {object} errorCodeAndMsg
 */
const getPublicationByDOI = async function getPublicationByDOI(publicationDoi, user) {
  try {
    // Check if there is no publication doi
    if (!publicationDoi) {
      throw { code: 400, message: 'Please provide a publication id' };
    }

    // Get publication by doi
    const publicationQuery = await db.query('select * from publications where doi=$1', [publicationDoi]);
    if (publicationQuery && publicationQuery.rows && publicationQuery.rows[0]) {
      return publicationQuery.rows[0];
    } else {
      return false;
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get publication by doi';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function getPublicationsByProjectId
 * @summary Get publications by project id
 * @param {number} projectId Project id
 * @param {user} user User information
 * @returns {object} publicationResults
 * @throws {object} errorCodeAndMsg
 */
const getPublicationsByProjectId = async function getPublicationsByProjectId(projectId, user) {
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

    // Get publications by project id
    const publicationQuery = await db.query('select * from publications_projects where project_id=$1', [projectId]);
    if (publicationQuery && publicationQuery.rows) {
      return publicationQuery.rows;
    } else {
      throw { code: 500, message: 'Could not find publications by project id' };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get publications by project id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

module.exports = {
  newPublication,
  deletePublicationByDOI,
  deletePublicationById,
  addPublicationToProjectByDoi,
  addPublicationToProjectById,
  deletePublicationFromProjectByDoi,
  deletePublicationFromProjectById,
  deleteAllPublicationsFromProject,
  getPublicationById,
  getPublicationByDOI,
  getPublicationsByProjectId
};
