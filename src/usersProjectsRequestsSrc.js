const moment = require('moment');
const Ajv = require('ajv');
const usersProjectsRequestSchema = require('../schemas/usersProjectsRequestSchema.json');
const usersProjectsRequestSchemaOptional = require('../schemas/usersProjectsRequestSchemaOptional.json');
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

    // Check user project request object schema
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
 * @function deleteUserProjectRequestById
 * @summary Delete user project request(s) by id
 * @param {array} userProjectRequestIds User project request(s) id
 * @param {user} user User information
 * @returns {object} deleteUserProjectRequestResults
 * @throws {object} errorCodeAndMsg
 */
const deleteUserProjectRequestById = async function deleteUserProjectRequestById(userProjectRequestIds, user) {
  try {
    // Check if there is no user project request ids
    if (!userProjectRequestIds) {
      throw { code: 400, message: 'Please provide user project request ids to delete' };
    }

    // Delete publication by DOI
    userProjectRequestIds.forEach(async (userProjectRequestId) => {
      await db.query('delete from users_projects_requests where id=$1', [userProjectRequestId]);
    });

    return { message: 'User project request deleted successfully by id' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not delete user project request by id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * @async
 * @function modifyUserProjectRequest
 * @summary Modify an existing user project request
 * @param {number} userProjectRequestId User project request id
 * @param {object} userProjectRequest Rubus format user project request
 * @param {user} user User information
 * @returns {object} modifyUserProjectRequestResults
 * @throws {object} errorCodeAndMsg
 */
const modifyUserProjectRequest = async function modifyUserProjectRequest(userProjectRequest, user) {
  try {
    // Check if there is no user project request
    if (!userProjectRequest) {
      throw { code: 400, message: 'Please provide a user project request to modify' };
    }

    // Check user project request object schema
    const ajv = new Ajv();
    const schemaValidation = await ajv.validate(usersProjectsRequestSchemaOptional, userProjectRequest);

    if (!schemaValidation) {
      throw { code: 400, message: 'Please provide correct user project request format to modify, schema failed to validate.' };
    }

    // Build dynamic insert query
    const userProjectRequestKeys = Object.keys(userProjectRequest);
    const userProjectRequestKeysCount = [];
    const userProjectRequestValues = [];
    userProjectRequestKeys.forEach((k, i) => {
      userProjectRequestKeysCount.push(`$${i + 1}`);
      userProjectRequestValues.push(`${userProjectRequest[k]}=$${i+2}`);
    });
    const queryLine = `update users_projects_requests set (${userProjectRequestKeys.toString().replace(/\,/gm, ' ')}) where id=$1`;

    // Add user project request id to the beignning of values
    userProjectRequestValues.unshift(userProjectRequestId);

    // Create a user project request in the database
    await db.query(queryLine, userProjectRequestValues);

    return { message: 'User project request modified successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not modify user project request';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

// Get one, get all, fix permission, test out the functions

module.exports = {
  newUserProjectRequest,
  deleteUserProjectRequestById,
  modifyUserProjectRequest
};
