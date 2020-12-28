const { logger } = require('./logger');
const db = require('../db/db');

/**
 * @async
 * @function checkUserProjectPermission
 * @summary Check if user has permissions to modify a project
 * @param {number} userId User Id
 * @param {number} projectId Project Id
 * @returns {object} results
 * @throws {object} errorDetails
 */
const checkUserProjectPermission = async function checkUserProjectPermission(userId, projectId) {
  try {
    const userProjectPermissionQuery = await db.query('select project_id from projects_users where user_id=$1', [userId]);
    logger.debug({ label: 'user project permission query response', results: userProjectPermissionQuery.rows });

    if (!userProjectPermissionQuery || !userProjectPermissionQuery.rows || !userProjectPermissionQuery.rows[0] || !userProjectPermissionQuery.rows[0].project_id || !userProjectPermissionQuery['rows'][0]['project_id'].includes(projectId)) {
      throw { code: 403, message: 'User does not have requests permissions on selected project.' };
    } else {
      return { allowed: true };
    }
  } catch (error) {
    throw { code: 403, message: 'User does not have requests permissions on selected project.' };
  }
};

/**
 * @async
 * @function checkUserInProject
 * @summary Check if a user in a project
 * @param {number} userId User Id
 * @param {number} projectId Project Id
 * @returns {object} results
 * @throws {object} errorDetails
 */
const checkUserInProject = async function checkUserInProject(userId, projectId) {
  try {
    const userProjectQuery = await db.query('select project_id from projects_users where user_id=$1 and project_id=$2', [userId, projectId]);
    logger.debug({ label: 'user in project query response', results: userProjectQuery.rows });

    if (!userProjectQuery || !userProjectQuery.rows || !userProjectQuery.rows[0]) {
      throw { code: 403, message: 'User is not the selected project' };
    } else {
      return { allowed: true };
    }
  } catch (error) {
    throw { code: 403, message: 'User is not in the project' };
  }
};

/**
 * @function titleCase
 * @summary Convert a string to title case format
 * @params {string} inputString Input string
 * @returns {string} titleCaseString
 */
const titleCase = function titleCase(inputString) {
  try {
    return inputString.toLowerCase().split(' ').map(function (word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  } catch (error) {
    return inputString;
  }
};

module.exports = {
  checkUserProjectPermission,
  checkUserInProject,
  titleCase
};
