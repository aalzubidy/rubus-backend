const moment = require('moment');
const db = require('../db/db');
const authorizationSrc = require('./authorizationSrc');

const updateUser = async function updateUser(userid, name, email, organization, password) {
  try {
    // Update user  and description name, email, organization, password.
    const updateQuery = await db.query('update users set name=$1, email=$2, organization=$3, password=$4 where userid=$5', [name, email, organization, password, userid]);
    if (!updateQuery) {
      throw {
        code: 500,
        message: 'Could not update user in the database'
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

// const removeUser = async function removeUser(userId, user) {
//   const deletedUser = [];
//   try {
//     const {
//       id,
//       email
//     } = user;
//   } catch {
//     if (!userId || projectUsers.length <= 0) {
//       throw {
//         code: 400,
//         message: 'Please provide a valid user to remove'
//       };
//     }
//   }
// }

module.exports = {
  updateUser,
  // removeUser
};
