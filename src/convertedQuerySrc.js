const moment = require('moment');
const { srcFileErrorHandler } = require('../utils/srcFile');
const db = require('../utils/db');

/**
 * Store a new converted query
 * @param {string} inputQuery Input query
 * @param {string} outputQuery Output query converted
 * @param {object} user User information
 * @returns {object} storeQueryResults
 * @throws {object} errorCodeAndMsg
 */
const storeConvertedQuery = async function storeConvertedQuery(inputQuery, outputQuery, user) {
  try {
    // Check if there is no email or password
    if (!inputQuery || !outputQuery) {
      throw { code: 400, message: 'Please provide a query and its conversion' };
    }

    // Get date
    const createDate = moment().format('MM/DD/YYYY');

    // Insert a converted query in the database
    const [insertConvertedQuery] = await db.query('INSERT INTO convert_queries(input_query, output_query, user_id, create_date) VALUES($1, $2, $3, $4) returning id', [inputQuery.trim(), outputQuery.trim(), user.id, createDate], 'new converted query');

    return { message: 'Query stored successfully', id: insertConvertedQuery.id };
  } catch (error) {
    const errorMsg = 'Could not store query';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * Get user converted queries
 * @param {object} user User information
 * @returns {array} convertedQueries list of converted queries
 * @throws {object} errorCodeAndMsg
 */
const getConvertedQueries = async function getConvertedQueries(user) {
  try {
    const {
      id
    } = user;

    // Get converted queries from the database
    const convertedQueries = await db.query('select * from convert_queries where user_id=$1', [id], 'get converted queries');

    if (!convertedQueries || convertedQueries.length <= 0) {
      throw { code: 404, message: 'User does not have any stored converted queries' };
    }

    return convertedQueries;
  } catch (error) {
    const errorMsg = 'Could not get converted queries';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * Get a single converted query
 * @param {string} queryId Converted query id
 * @param {object} user User information
 * @returns {object} convertedQuery
 * @throws {object} errorCodeAndMsg
 */
const getConvertedQuery = async function getConvertedQuery(queryId, user) {
  try {
    const {
      id
    } = user;

    // Get converted query from the database
    const [convertedQuery] = await db.query('select * from convert_queries where user_id=$1 and id=$2', [id, queryId], 'get converted query');

    if (!convertedQuery || convertedQuery.length <= 0) {
      throw { code: 404, message: 'Could not find user converted query' };
    }

    return convertedQuery;
  } catch (error) {
    const errorMsg = 'Could not get converted query';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * Delete a single converted query
 * @param {string} queryId Converted query id
 * @param {object} user User information
 * @returns {object} deleteConvertQueryResults
 * @throws {object} errorCodeAndMsg
 */
const deleteConvertedQuery = async function deleteConvertedQuery(queryId, user) {
  try {
    const {
      id
    } = user;

    // Delete converted query from the database
    await db.query('delete from convert_queries where user_id=$1 and id=$2', [id, queryId], 'delete converted query');

    return { 'message': 'Deleted succesfully' };
  } catch (error) {
    const errorMsg = 'Could not delete converted query';
    srcFileErrorHandler(error, errorMsg);
  }
};

module.exports = {
  storeConvertedQuery,
  getConvertedQueries,
  getConvertedQuery,
  deleteConvertedQuery
};
