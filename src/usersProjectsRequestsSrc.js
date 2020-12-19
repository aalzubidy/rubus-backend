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
    const { id } = user;

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

    // Check if the user is allowed to make requests on the project
    const userProjectPermissionQuery = await db.query('select project_id from projects_users where user_id=$1', [id]);
    if (!userProjectPermissionQuery || !userProjectPermissionQuery.rows || !userProjectPermissionQuery.rows[0] || !userProjectPermissionQuery.rows[0].project_id || !userProjectPermissionQuery['rows'][0]['project_id'].includes(userProjectRequest['project_id'])) {
      throw { code: 403, message: 'User does not have requests permissions on selected project.' };
    }

    // Get date
    const createDate = moment().format();
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
      console.log(error);
      throw error;
    }
    const userMsg = 'Could not create user project request';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
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

    // Check if the user is allowed to make requests on the project
    const userProjectPermissionQuery = await db.query('select project_id from projects_users where user_id=$1', [id]);
    if (!userProjectPermissionQuery || !userProjectPermissionQuery.rows || !userProjectPermissionQuery.rows[0] || !userProjectPermissionQuery.rows[0].project_id || !userProjectPermissionQuery['rows'][0]['project_id'].includes(projectId)) {
      throw { code: 403, message: 'User does not have requests permissions on selected project.' };
    }

    // Delete user project request by id
    await db.query('delete from users_projects_requests where id=$1', [userProjectRequestId]);

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

    // Check if the user is allowed to make requests on the project
    const userProjectPermissionQuery = await db.query('select project_id from projects_users where user_id=$1', [id]);
    if (!userProjectPermissionQuery || !userProjectPermissionQuery.rows || !userProjectPermissionQuery.rows[0] || !userProjectPermissionQuery.rows[0].project_id || !userProjectPermissionQuery['rows'][0]['project_id'].includes(projectId)) {
      throw { code: 403, message: 'User does not have requests permissions on selected project.' };
    }

    // Build dynamic insert query
    const userProjectRequestKeys = Object.keys(userProjectRequest);
    const userProjectRequestKeysCount = [];
    const userProjectRequestValues = [];
    userProjectRequestKeys.forEach((k, i) => {
      userProjectRequestKeysCount.push(`${k}=$${i + 2}`);
      userProjectRequestValues.push(userProjectRequest[k]);
    });
    const queryLine = `update users_projects_requests set ${userProjectRequestKeysCount.toString().replace(/\,/gm, ' ')} where id=$1`;

    // Add user project request id to the beignning of values
    userProjectRequestValues.unshift(userProjectRequestId);

    // Create a user project request in the database
    await db.query(queryLine, userProjectRequestValues);

    return { message: 'User project request modified successfully' };
  } catch (error) {
    if (error.code) {
      console.log(error);
      throw error;
    }
    const userMsg = 'Could not modify user project request';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
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

    // Check if the user is allowed to make requests on the project
    const userProjectPermissionQuery = await db.query('select project_id from projects_users where user_id=$1', [id]);
    if (!userProjectPermissionQuery || !userProjectPermissionQuery.rows || !userProjectPermissionQuery.rows[0] || !userProjectPermissionQuery.rows[0].project_id || !userProjectPermissionQuery['rows'][0]['project_id'].includes(projectId)) {
      throw { code: 403, message: 'User does not have requests permissions on selected project.' };
    }

    // Get user project request by id
    const item = await db.query('select * from users_projects_requests where id=$1', [userProjectRequestId]);
    if (item && item.rows && item.rows[0]) {
      return { userProjectRequest: item.row[0] };
    } else {
      throw { code: 404, message: 'User project request not found using id' };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not retrieve user project request by id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
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

    // Check if the user is allowed to make requests on the project
    const userProjectPermissionQuery = await db.query('select project_id from projects_users where user_id=$1', [id]);
    if (!userProjectPermissionQuery || !userProjectPermissionQuery.rows || !userProjectPermissionQuery.rows[0] || !userProjectPermissionQuery.rows[0].project_id || !userProjectPermissionQuery['rows'][0]['project_id'].includes(projectId)) {
      throw { code: 403, message: 'User does not have requests permissions on selected project.' };
    }

    // Get user project request by project id
    const item = await db.query('select * from users_projects_requests where project_id=$1', [projectId]);
    if (item && item.rows && item.rows[0]) {
      return { userProjectRequests: item.rows[0] };
    } else {
      throw { code: 404, message: 'User project request not found using project id' };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not retrieve user project request by id';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

module.exports = {
  newUserProjectRequest,
  deleteUserProjectRequest,
  modifyUserProjectRequest,
  getUserProjectRequestById,
  getUserProjectRequestByProjectId
};
