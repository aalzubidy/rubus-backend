const moment = require('moment');
const { srcFileErrorHandler } = require('../utils/srcFile');
const db = require('../utils/db');
const tools = require('./tools');

/**
 * Store a new search query
 * @param {string} inputQuery Input query
 * @param {string} dbName Database name
 * @param {string} totalResults Total number of results for the query
 * @param {string} projectId Project Id
 * @param {object} user User information
 * @returns {object} storeQueryResults
 * @throws {object} errorCodeAndMsg
 */
const storeSearchQuery = async function storeSearchQuery(inputQuery, dbName, totalResults, projectId, user) {
  try {
    // Check if there is no email or password
    if (!inputQuery || !dbName || !projectId) {
      throw { code: 400, message: 'Please provide a query, databsae name, and a project id' };
    }

    // Check if the user is in the project
    await tools.checkUserInProject(user.id, projectId);

    // Get date
    const createDate = moment().format();

    // Insert a search query in the database
    const [insertSearchQuery] = await db.query('INSERT into search_queries(input_query, db, total_results, project_id, user_id, create_date) VALUES($1, $2, $3, $4, $5, $6) returning id', [inputQuery.trim(), dbName.trim(), totalResults, projectId, user.id, createDate], 'insert search query');

    return { message: 'Search query stored successfully', id: insertSearchQuery.id };
  } catch (error) {
    const errorMsg = 'Could not store search query';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * Get user search queries
 * @param {object} user User information
 * @returns {array} searchQueries list of search queries
 * @throws {object} errorCodeAndMsg
 */
const getSearchQueries = async function getSearchQueries(user) {
  try {
    const {
      id
    } = user;

    // Get search queries from the database
    const searchQueries = await db.query('select * from search_queries where user_id=$1', [id], 'get search queries');

    if (!searchQueries || searchQueries.length <= 0) {
      throw { code: 404, message: 'User does not have any stored search queries' };
    }

    return searchQueries;
  } catch (error) {
    const errorMsg = 'Could not get search queries';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * Get project search queries
 * @param {object} user User information
 * @param {string} projectId Project Id
 * @returns {array} searchQueries list of project search queries
 * @throws {object} errorCodeAndMsg
 */
const getProjectSearchQueries = async function getProjectSearchQueries(projectId, user) {
  try {
    const {
      id
    } = user;

    // Check if the user is in the project
    await tools.checkUserInProject(id, projectId);

    // Get project search queryies from the database
    const searchQueries = await db.query('select * from search_queries where project_id=$1', [projectId], 'get project search query');

    if (!searchQueries || searchQueries.length <= 0) {
      throw { code: 404, message: 'Project does not have any stored search queries' };
    }

    return searchQueries;
  } catch (error) {
    const errorMsg = 'Could not get project search queries';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * Get a single search query
 * @param {string} queryId Search query id
 * @param {string} projectId Project id
 * @param {object} user User information
 * @returns {object} searchQuery
 * @throws {object} errorCodeAndMsg
 */
const getSearchQuery = async function getSearchQuery(queryId, projectId, user) {
  try {
    const {
      id
    } = user;

    // Get search query from the database
    const [searchQuery] = await db.query('select * from search_queries where id=$1 and project_id=$2', [queryId, projectId], 'get search query');

    if (!searchQuery || searchQuery.length <= 0) {
      throw { code: 404, message: 'Could not find user search query' };
    }

    return searchQuery;
  } catch (error) {
    const errorMsg = 'Could not get search query';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * Delete a single search query
 * @param {string} queryId Search query id
 * @param {string} projectId Project id
 * @param {object} user User information
 * @returns {object} deleteSearchQueryResults
 * @throws {object} errorCodeAndMsg
 */
const deleteSearchQuery = async function deleteSearchQuery(queryId, projectId, user) {
  try {
    const {
      id
    } = user;

    // Delete search query from the database
    await db.query('delete from search_queries where id=$1 and project_id=$2', [queryId, projectId], 'delete search query');

    return { 'message': 'Deleted search query succesfully' };
  } catch (error) {
    const errorMsg = 'Could not delete search query';
    srcFileErrorHandler(error, errorMsg);
  }
};

module.exports = {
  storeSearchQuery,
  getSearchQueries,
  getProjectSearchQueries,
  getSearchQuery,
  deleteSearchQuery
};
