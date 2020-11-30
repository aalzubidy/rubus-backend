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

    // Create a user in the database
    await db.query('INSERT INTO searchQueries(input_query, db, total_results, project_id, user_id, create_date) VALUES($1, $2, $3, $4, $5, $6)', [inputQuery.trim(), db.trim(), totalResults, projectId, user.id, createDate]);

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

    // Get converted queryies from the database
    const searchQueries = await db.query('select * from convertQueries where user_id=$1', [id]);
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

// /**
//  * Get a single converted query
//  * @param {string} queryId Converted query id
//  * @param {object} user User information
//  * @returns {object} convertedQuery
//  * @throws {object} errorCodeAndMsg
//  */
// const getConvertedQuery = async function getConvertedQuery(queryId, user) {
//   try {
//     const {
//       id
//     } = user;

//     // Get converted queryies from the database
//     const convertedQuery = await db.query('select * from convertQueries where user_id=$1 and id=$2', [id, queryId]);
//     if (!convertedQuery || !convertedQuery.rows || convertedQuery.rows.length <= 0) {
//       throw { code: 404, message: 'Could not find user converted query' };
//     }

//     return convertedQuery.rows;
//   } catch (error) {
//     if (error.code) {
//       throw error;
//     }
//     const userMsg = 'Could not get converted query';
//     console.log(userMsg, error);
//     throw { code: 500, message: userMsg };
//   }
// };

// /**
//  * Delete a single converted query
//  * @param {string} queryId Converted query id
//  * @param {object} user User information
//  * @returns {object} deleteConvertQueryResults
//  * @throws {object} errorCodeAndMsg
//  */
// const deleteConvertedQuery = async function deleteConvertedQuery(queryId, user) {
//   try {
//     const {
//       id
//     } = user;

//     // Get converted queryies from the database
//     const convertedQuery = await db.query('delete from convertQueries where user_id=$1 and id=$2', [id, queryId]);
//     if (!convertedQuery) {
//       throw { code: 404, message: 'Could not delete user converted query' };
//     }

//     return {'message': 'Deleted succesfully'};
//   } catch (error) {
//     if (error.code) {
//       throw error;
//     }
//     const userMsg = 'Could not delete converted query';
//     console.log(userMsg, error);
//     throw { code: 500, message: userMsg };
//   }
// };

module.exports = {
  storeSearchQuery,
  getSearchQueries,
  // getConvertedQuery,
  // deleteConvertedQuery
};
