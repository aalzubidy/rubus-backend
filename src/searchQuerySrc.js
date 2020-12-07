const moment = require('moment');
const db = require('../db/db');

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

    // Get date
    const createDate = moment().format('MM/DD/YYYY');

    // Insert a search query in the database
    await db.query('INSERT into search_queries(input_query, db, total_results, project_id, user_id, create_date) VALUES($1, $2, $3, $4, $5, $6)', [inputQuery.trim(), db.trim(), totalResults, projectId, user.id, createDate]);

    return { message: 'Search query stored successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not store search query';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
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
    const searchQueries = await db.query('select * from search_queries where user_id=$1', [id]);
    if (!searchQueries || !searchQueries.rows || searchQueries.rows.length <= 0) {
      throw { code: 404, message: 'User does not have any stored search queries' };
    }

    return searchQueries.rows;
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get search queries';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
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

    // Get project search queryies from the database
    const searchQueries = await db.query('select * from search_queries where project_id=$1', [projectId]);
    if (!searchQueries || !searchQueries.rows || searchQueries.rows.length <= 0) {
      throw { code: 404, message: 'Project does not have any stored search queries' };
    }

    return searchQueries.rows;
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get project search queries';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
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
    const searchQuery = await db.query('select * from search_queries where id=$1 and project_id=$2', [queryId, projectId]);
    if (!searchQuery || !searchQuery.rows || searchQuery.rows.length <= 0) {
      throw { code: 404, message: 'Could not find user search query' };
    }

    return searchQuery.rows;
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not get search query';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
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
    const searchQuery = await db.query('delete from search_queries where id=$1 and project_id=$2', [queryId, projectId]);
    if (!searchQuery) {
      throw { code: 404, message: 'Could not delete search query' };
    }

    return {'message': 'Deleted search query succesfully'};
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete search query';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

module.exports = {
  storeSearchQuery,
  getSearchQueries,
  getProjectSearchQueries,
  getSearchQuery,
  deleteSearchQuery
};
