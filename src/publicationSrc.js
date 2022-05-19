const moment = require('moment');
const Ajv = require('ajv');
const { logger } = require('../utils/logger');
const { srcFileErrorHandler } = require('../utils/srcFile');
const publicationSchema = require('../schemas/publicationSchema.json');
const db = require('../db/db');
const tools = require('./tools');

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
    const queryLine = `insert into publications(${publicationKeys.toString()}) values(${publicationKeysCount.toString()}) ON CONFLICT DO NOTHING returning id`;

    // Create a publication in the database
    const newPublicationQuery = await db.query(queryLine, publicationValues);
    logger.debug({ label: 'new publication query response', results: newPublicationQuery.rows });

    return { message: 'Publication created successfully', id: newPublicationQuery.rows[0].id };
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not create publication';
    srcFileErrorHandler(error, errorMsg);
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
    const errorMsg = 'Could not delete publication by doi';
    srcFileErrorHandler(error, errorMsg);
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
    const errorMsg = 'Could not delete publication by id';
    srcFileErrorHandler(error, errorMsg);
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

    // Check the user in project
    await tools.checkUserInProject(id, projectId);

    const successItems = [];
    const failedItems = [];

    // Retreive publication by id and add it to a project
    for await (const doi of dois) {
      try {
        const queryLinkPublication = await db.query('insert into publications_projects(publication_id, project_id, search_query_id) values((select id from publications where doi=$1), $2, $3) ON CONFLICT DO NOTHING', [doi, projectId, searchQueryId]);
        if (queryLinkPublication) {
          successItems.push(doi);
        } else {
          failedItems.push(doi);
        }
      } catch (error) {
        failedItems.push(doi);
      }
    }

    let returnMsg = 'All publications added to project successfully by doi';
    if (failedItems.length > 0) {
      returnMsg = 'Some publications added sccussefully by doi, and some pubications failed.';
    }

    return { message: returnMsg, successItems, failedItems };
  } catch (error) {
    const errorMsg = 'Could not add publications to a project by doi';
    srcFileErrorHandler(error, errorMsg);
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

    // Check the user in project
    await tools.checkUserInProject(id, projectId);

    const successItems = [];
    const failedItems = [];

    // Retreive publication by id and add it to a project
    for await (const publicationId of publicationIds) {
      try {
        const queryLinkPublication = await db.query('insert into publications_projects(publication_id, project_id, search_query_id) values($1, $2, $3) ON CONFLICT DO NOTHING', [publicationId, projectId, searchQueryId]);
        if (queryLinkPublication) {
          successItems.push(publicationId);
        } else {
          failedItems.push(publicationId);
        }
      } catch (error) {
        failedItems.push(publicationId);
      }
    }

    let returnMsg = 'All publications added to project successfully by id';
    if (failedItems.length > 0) {
      returnMsg = 'Some publications added sccussefully by id, and some publications failed.';
    }

    return { message: returnMsg, successItems, failedItems };
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not add publications to a project by id';
    srcFileErrorHandler(error, errorMsg);
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

    // Check the user in project
    await tools.checkUserInProject(id, projectId);

    const successItems = [];
    const failedItems = [];

    // Retreive publication by id and add it to a project
    for await (const doi of dois) {
      try {
        const queryLinkPublication = await db.query('delete from publications_projects where publication_id=(select id from publications where doi=$1) and project_id=$2', [doi, projectId]);
        if (queryLinkPublication) {
          successItems.push(doi);
        } else {
          failedItems.push(doi);
        }
      } catch (error) {
        failedItems.push(doi);
      }
    }

    let returnMsg = 'All publications deleted from project successfully by doi';
    if (failedItems.length > 0) {
      returnMsg = 'Some publications dleted sccussefully by doi, and some publications failed.';
    }

    return { message: returnMsg, successItems, failedItems };
  } catch (error) {
    const errorMsg = 'Could not delete publications from a project by doi';
    srcFileErrorHandler(error, errorMsg);
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

    // Check the user in project
    await tools.checkUserInProject(id, projectId);

    const successItems = [];
    const failedItems = [];

    // Retreive publication by id and add it to a project
    for await (const publicationId of publicationIds) {
      try {
        const queryLinkPublication = await db.query('delete from publications_projects where publication_id=$1 and project_id=$2', [publicationId, projectId]);
        if (queryLinkPublication) {
          successItems.push(publicationId);
        } else {
          failedItems.push(publicationId);
        }
      } catch (error) {
        failedItems.push(publicationId);
      }
    }

    let returnMsg = 'All publications deleted from project successfully by id';
    if (failedItems.length > 0) {
      returnMsg = 'Some publications deleted sccussefully by id, and some publications failed.';
    }

    return { message: returnMsg, successItems, failedItems };
  } catch (error) {
    const errorMsg = 'Could not delete publications from a project by id';
    srcFileErrorHandler(error, errorMsg);
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

    // Check the user in project
    await tools.checkUserInProject(id, projectId);

    // Delete all publications from a project
    const deletePublicationQuery = await db.query('delete from publications_projects where project_id=$1', [projectId]);
    if (deletePublicationQuery) {
      return { message: 'All publication were deleted from a project successfully' };
    } else {
      throw { code: 500, message: 'Could not delete publications from a project' };
    }
  } catch (error) {
    const errorMsg = 'Could not delete all publications from a project';
    srcFileErrorHandler(error, errorMsg);
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
    logger.debug({ label: 'get publication by id query response', results: publicationQuery.rows });

    if (publicationQuery && publicationQuery.rows && publicationQuery.rows[0]) {
      return publicationQuery.rows[0];
    } else {
      throw { code: 500, message: 'Could not find publication by id' };
    }
  } catch (error) {
    const errorMsg = 'Could not get publication by id';
    srcFileErrorHandler(error, errorMsg);
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
    logger.debug({ label: 'get publication by doi query response', results: publicationQuery.rows });

    if (publicationQuery && publicationQuery.rows && publicationQuery.rows[0]) {
      return publicationQuery.rows[0];
    } else {
      return false;
    }
  } catch (error) {
    const errorMsg = 'Could not get publication by doi';
    srcFileErrorHandler(error, errorMsg);
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

    // Check the user in project
    await tools.checkUserInProject(id, projectId);

    // Get publications by project id
    const publicationQuery = await db.query('select * from publications, publications_projects where publications_projects.project_id=$1 and publications.id=publications_projects.publication_id', [projectId]);
    logger.debug({ label: 'get publications by project id query response', results: publicationQuery.rows });

    if (publicationQuery && publicationQuery.rows) {
      return publicationQuery.rows;
    } else {
      throw { code: 500, message: 'Could not find publications by project id' };
    }
  } catch (error) {
    const errorMsg = 'Could not get publications by project id';
    srcFileErrorHandler(error, errorMsg);
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
