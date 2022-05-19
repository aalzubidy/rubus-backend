const moment = require('moment');
const Ajv = require('ajv');
const { logger } = require('../utils/logger');
const { srcFileErrorHandler } = require('../utils/srcFile');
const usersProjectsRequestSchema = require('../schemas/usersProjectsRequestSchema.json');
const usersProjectsRequestSchemaOptional = require('../schemas/usersProjectsRequestSchemaOptional.json');
const db = require('../db/db');
const tools = require('./tools');

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
    const { id } = user;

    // Check if there is no user project request
    if (!userProjectRequest) {
      throw { code: 400, message: 'Please provide a userProjectRequest' };
    }

    userProjectRequest['user_id'] = id;

    userProjectRequest['status'] = userProjectRequest['status'] || 'requested';

    // Get date
    const createDate = moment().format();
    userProjectRequest['create_date'] = createDate;

    // Check user project request object schema
    const ajv = new Ajv();
    const schemaValidation = await ajv.validate(usersProjectsRequestSchema, userProjectRequest);

    if (!schemaValidation) {
      throw { code: 400, message: 'Please provide correct user project request format, schema failed to validate.' };
    }

    // Check if the user is in the project
    await tools.checkUserInProject(id, userProjectRequest['project_id']);

    // Build dynamic insert query
    const userProjectRequestKeys = Object.keys(userProjectRequest);
    const userProjectRequestKeysCount = [];
    const userProjectRequestValues = [];
    userProjectRequestKeys.forEach((k, i) => {
      userProjectRequestKeysCount.push(`$${i + 1}`);
      userProjectRequestValues.push(userProjectRequest[k]);
    });
    const queryLine = `insert into users_projects_requests(${userProjectRequestKeys.toString()}) values(${userProjectRequestKeysCount.toString()}) returning id`;

    // Create a user project request in the database
    const insertQueryResults = await db.query(queryLine, userProjectRequestValues);
    logger.debug({ label: 'new user project query response', results: insertQueryResults.rows });

    return { message: 'User project request created successfully', id: insertQueryResults.rows[0]['id'] };
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not create user project request';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @async
 * @function deleteUserProjectRequest
 * @summary Delete user project request by id
 * @param {number} userProjectRequestId User project request id
 * @param {number} projectId Project id
 * @param {user} user User information
 * @returns {object} deleteUserProjectRequestResults
 * @throws {object} errorCodeAndMsg
 */
const deleteUserProjectRequest = async function deleteUserProjectRequest(userProjectRequestId, projectId, user) {
  try {
    const { id } = user;

    // Check if there is no user project request id or project id
    if (!userProjectRequestId || !projectId) {
      throw { code: 400, message: 'Please provide user project request id, and a project id to delete' };
    }

    // Check if the user is in the project
    await tools.checkUserInProject(id, projectId);

    // Delete user project request by id
    const deleteQuery = await db.query('delete from users_projects_requests where id=$1 and project_id=$2', [userProjectRequestId, projectId]);
    logger.debug({ label: 'delete user project query response', results: deleteQuery });

    return { message: 'User project request deleted successfully by id' };
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not delete user project request by id';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @async
 * @function modifyUserProjectRequest
 * @summary Modify an existing user project request
 * @param {number} userProjectRequestId User project request id
 * @param {object} userProjectRequest Rubus format user project request
 * @param {number} projectId Project id
 * @param {user} user User information
 * @returns {object} modifyUserProjectRequestResults
 * @throws {object} errorCodeAndMsg
 */
const modifyUserProjectRequest = async function modifyUserProjectRequest(userProjectRequestId, userProjectRequest, projectId, user) {
  try {
    const { id } = user;

    // Check if there is no user project request id, user project request, or no project id
    if (!userProjectRequestId || !userProjectRequest || !projectId) {
      throw { code: 400, message: 'Please provide a user project request id, user project request, and a project id to modify' };
    }

    // Check user project request object schema
    const ajv = new Ajv();
    const schemaValidation = await ajv.validate(usersProjectsRequestSchemaOptional, userProjectRequest);

    if (!schemaValidation) {
      throw { code: 400, message: 'Please provide correct user project request format to modify, schema failed to validate.' };
    }

    // Check if the user is in the project
    await tools.checkUserInProject(id, projectId);

    // Build dynamic insert query
    const userProjectRequestKeys = Object.keys(userProjectRequest);
    const userProjectRequestKeysCount = [];
    const userProjectRequestValues = [];
    userProjectRequestKeys.forEach((k, i) => {
      userProjectRequestKeysCount.push(`${k}=$${i + 2}`);
      userProjectRequestValues.push(userProjectRequest[k]);
    });
    const queryLine = `update users_projects_requests set ${userProjectRequestKeysCount.toString()} where id=$1`;

    // Add user project request id to the beignning of values
    userProjectRequestValues.unshift(userProjectRequestId);

    // Modify a user project request in the database
    const modifyQuery = await db.query(queryLine, userProjectRequestValues);
    logger.debug({ label: 'modify user project query response', results: modifyQuery });

    return { message: 'User project request modified successfully' };
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not modify user project request';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @async
 * @function getUserProjectRequestById
 * @summary Get user project request by id
 * @param {number} userProjectRequestId User project request id
 * @param {number} projectId Project id
 * @param {user} user User information
 * @returns {object} userProjectRequestResults
 * @throws {object} errorCodeAndMsg
 */
const getUserProjectRequestById = async function getUserProjectRequestById(userProjectRequestId, projectId, user) {
  try {
    const { id } = user;

    // Check if there is no user project request id or no project id
    if (!userProjectRequestId || !projectId) {
      throw { code: 400, message: 'Please provide user project request id and a project id to retrieve' };
    }

    // Check if the user is in the project
    await tools.checkUserInProject(id, projectId);

    // Get user project request by id
    const item = await db.query('select * from users_projects_requests where id=$1', [userProjectRequestId]);
    logger.debug({ label: 'get user project by id query response', results: item.rows });

    if (item && item.rows && item.rows[0]) {
      return item.rows[0];
    } else {
      throw { code: 404, message: 'User project request not found using id' };
    }
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not retrieve user project request by id';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @async
 * @function getUserProjectRequestByProjectId
 * @summary Get user project request(s) by project id
 * @param {number} projectId Project id
 * @param {user} user User information
 * @returns {object} userProjectRequestResults
 * @throws {object} errorCodeAndMsg
 */
const getUserProjectRequestByProjectId = async function getUserProjectRequestByProjectId(projectId, user) {
  try {
    const { id } = user;

    // Check if there is no project id
    if (!projectId) {
      throw { code: 400, message: 'Please provide a project id to retrieve' };
    }

    // Check if the user is in the project
    await tools.checkUserInProject(id, projectId);

    // Get user project request by project id
    const item = await db.query('select * from users_projects_requests where project_id=$1', [projectId]);
    logger.debug({ label: 'get user project by project id query response', results: item.rows });

    if (item && item.rows && item.rows[0]) {
      return item.rows;
    } else {
      throw { code: 404, message: 'User project request not found using project id' };
    }
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not retrieve user project request by id';
    srcFileErrorHandler(error, errorMsg);
  }
};

module.exports = {
  newUserProjectRequest,
  deleteUserProjectRequest,
  modifyUserProjectRequest,
  getUserProjectRequestById,
  getUserProjectRequestByProjectId
};
