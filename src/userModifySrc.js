const bcrypt = require('bcrypt');
const { logger } = require('./logger');
const db = require('../db/db');

/**
 *Update user information
 *@param {string} name Updating user name
 *@param {string} email  Updating user email
 *@param {string} organization Updating user organization
 *@returns {object} Updated user information
 *@throws {object} errorCodeAndMsg
 */
const updateUser = async function updateUser(name, email, organization, user) {
  try {
    const {
      id
    } = user;

    if (!email) {
      throw {
        code: 400,
        message: 'Please enter an email'
      };
    }

    // Updating user info
    const updateQuery = await db.query('update users set name=$1, email=$2, organization=$3 where id=$4', [name, email, organization, id]);
    if (!updateQuery) {
      throw {
        code: 500,
        message: 'Could not update user in the database, please check email provided data, make sure email is not used in another account.'
      };
    }

    return {
      'message': 'Updated user successfully'
    };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not update user';
    console.log(userMsg, error);
    throw {
      code: 500,
      message: userMsg
    };
  }
};

/**
 * update user password
 * @param {string} oldPassword user current password
 * @param {string} newPassword user new password
 * @param {object} user user object contains Id
 * @returns {object} updatePasswordResult
 * @throws {object} errorDetails
 */
const changeUserPassword = async function changeUserPassword(oldPassword, newPassword, user) {
  try {
    const {
      id
    } = user;

    if (!oldPassword || !newPassword) {
      throw {
        code: 400,
        message: 'Please enter a old and new password'
      };
    }

    // Get current password from database
    let currentPassword = await db.query('select password from users where id=$1', [id]);
    if (currentPassword) {
      currentPassword = currentPassword.rows[0].password;
    }

    // Comparing password
    const oldPasswordCheck = await bcrypt.compare(oldPassword, currentPassword);

    if (!oldPasswordCheck) {
      throw {
        code: 401,
        message: 'Old password does not match'
      };
    }

    // create a new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    const updateQuery = await db.query('update users set password=$1 where id=$2', [newPasswordHash, id]);
    if (!updateQuery) {
      throw {
        code: 500,
        message: 'Could not update password in the database.'
      };
    }

    return {
      'message': 'Updated password successfully'
    };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not update password';
    console.log(userMsg, error);
    throw {
      code: 500,
      message: userMsg
    };
  }
};

module.exports = {
  updateUser,
  changeUserPassword
};
