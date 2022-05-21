const db = require('./db');
const { logger } = require('./logger');

/**
 * @function signUpHandler
 * @summary Handle user registration in local database after it's registered in supertokens
 * @param {*} id created user id
 * @param {*} formFields input form fields
 * @returns boolean registrationStatus
 * @throws errorDetails
 */
const signUpHandler = async function signUpHandler(id, formFields) {
  try {
    const userInfo = {
      id,
      create_date: new Date().toISOString()
    };

    formFields.forEach((item) => {
      userInfo[item.id] = item.value;
    });

    delete userInfo.password;

    const [dbUser] = await db.query('insert into users(id, email, name, organization, create_date) values($1,$2,$3,$4,$5) returning id', [userInfo.id, userInfo.email, userInfo.name, userInfo.organization, userInfo.create_date], 'register new user locally');
    if (dbUser && dbUser.id) {
      logger.debug(`New user registered successfully ${dbUser.id}`);
      return true;
    } else {
      throw new Error({ code: 500, message: 'Could not complete user registration locally' });
    }
  } catch (error) {
    logger.error('Could not register user');
    logger.error(error);
    throw error;
  }
};

/**
 * @function signInHandler
 * @summary Handle user sign in by adding login date to database
 * @param {*} id user id
 * @returns boolean updateStatus
 * @throws errorDetails
 */
const signInHandler = async function signInHandler(id, formFields) {
  try {
    const [dbUser] = await db.query('update users set login_date=$1 where id=$2 returning id', [new Date().toISOString(), id], 'add user login date locally');
    if (dbUser && dbUser.id) {
      logger.debug(`User login date updated successfully ${dbUser.id}`);
      return true;
    } else {
      throw new Error({ code: 500, message: 'Could not update user login date locally' });
    }
  } catch (error) {
    logger.error('Could not update user login date');
    logger.error(error);
    throw error;
  }
};

module.exports = {
  signUpHandler,
  signInHandler
};
