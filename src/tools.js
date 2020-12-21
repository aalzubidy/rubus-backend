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
  titleCase
};
