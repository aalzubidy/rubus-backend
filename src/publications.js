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
    const schemaValidation = await ajv.validate(publicationSchema, {});

    if (!schemaValidation) {
      throw { code: 400, message: 'Please provide correct format publication, schema failed to validate.' };
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

    // Create a user in the database
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

    // Retreive publication by id and add it to the project
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
    const userMsg = 'Could add publications to project by doi';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

module.exports = {
  newPublication,
  deletePublicationByDOI,
  deletePublicationById,
  addPublicationToProjectByDoi
};
