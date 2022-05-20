const bcrypt = require('bcrypt');
const { srcFileErrorHandler } = require('../utils/srcFile');
const db = require('../utils/db');

/**
 * @function getUser
 * @summary Get user information by token
 * @param {object} user User information
 * @returns {object} User information
 * @throws {object} errorCodeAndMsg
 */
const getUser = async function getUser(user) {
  try {
    if (user) {
      return { id: user.id, name: user.name, email: user.email, organization: user.organization };
    } else {
      throw {
        code: 404,
        message: 'Could not find user information'
      };
    }
  } catch (error) {
    const errorMsg = 'Could not get user information';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function getUserByKey
 * @summary Get user information by id or email
 * @param {string} searchKey Key to search based on (id or email)
 * @param {string} searchValue Key value to search based on i.e user id or email
 * @param {object} user User information
 * @returns {object} User information
 * @throws {object} errorCodeAndMsg
 */
const getUserByKey = async function getUserByKey(searchKey, searchValue, user) {
  try {
    if (searchKey != 'id' && searchKey != 'email') {
      throw { code: 400, message: 'Key must be id or email only' };
    }

    if (!searchValue && searchKey === 'id') {
      searchValue = user.id;
    } else if (!searchValue && searchKey === 'email') {
      searchValue = user.id;
    } else if (!searchValue && searchKey != 'id' && searchKey != 'email') {
      throw { code: 400, message: 'You must pass email or id' };
    }

    let userSearchQuery = null;
    if (searchKey === 'id') {
      [userSearchQuery] = await db.query('select id, name, email, organization from users where id=$1', [searchValue], 'get user by id');
    } else {
      [userSearchQuery] = await db.query('select id, name, email, organization from users where email=$1', [searchValue], 'get user by email');
    }

    if (userSearchQuery) {
      return userSearchQuery;
    } else {
      throw { code: 404, message: 'Could not find user by key' };
    }
  } catch (error) {
    const errorMsg = 'Could not get user information by key';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function updateUser
 * @summary Update user information
 * @param {string} name Updating user name
 * @param {string} email  Updating user email
 * @param {string} organization Updating user organization
 * @param {object} user User information
 * @returns {object} Updated user information
 * @throws {object} errorCodeAndMsg
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
    const updateQuery = await db.query('update users set name=$1, email=$2, organization=$3 where id=$4 returning id', [name, email, organization, id], 'update user');

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
    const errorMsg = 'Could not update user';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function changeUserPassword
 * @summary update user password
 * @param {string} oldPassword user current password
 * @param {string} newPassword user new password
 * @param {object} user user object contains Id
 * @param {object} user User information
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
    let [currentPassword] = await db.query('select password from users where id=$1', [id], 'get user from db p');
    if (currentPassword) {
      currentPassword = currentPassword.password;
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
    const [updateQuery] = await db.query('update users set password=$1 where id=$2 returning id', [newPasswordHash, id], 'update user p');
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
    const errorMsg = 'Could not update password';
    srcFileErrorHandler(error, errorMsg);
  }
};

module.exports = {
  getUser,
  getUserByKey,
  updateUser,
  changeUserPassword
};
