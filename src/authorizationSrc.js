const jwt = require('jsonwebtoken');
const moment = require('moment');
const bcrypt = require('bcrypt');
const { logger } = require('../utils/logger');
const { srcFileErrorHandler } = require('../utils/srcFile');
const db = require('../utils/db');

const accessTokenSecret = process.env.RUBUS_ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.RUBUS_REFRESH_TOKEN_SECRET;

/**
 * @function register
 * @summary Register a new user in the system
 * @param {*} req http request contains user information
 * @returns {object} registerationResults
 * @throws {object} errorCodeAndMsg
 */
const register = async function register(req) {
  try {
    const {
      email,
      password,
      name,
      organization
    } = req.body;

    // Check if there is no email or password
    if (!email || !password) {
      throw { code: 400, message: 'Please provide email and password' };
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Generate create date
    const createDate = moment().format('MM/DD/YYYY');

    // Create a user in the database
    const [dbUser] = await db.query('INSERT INTO users(email, password, name, organization, register_ip, create_date) VALUES($1, $2, $3, $4, $5, $6) returning id', [email, hash, name, organization, req.clientIp, createDate], 'registration query');

    return { message: 'User registered successfully', id: dbUser.id };
  } catch (error) {
    const errorMsg = 'Could not register user';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function login
 * @summary Login to the system
 * @param {*} req http request contains email and password
 * @returns {object} credientials Access Token and Refresh Token
 * @throws {object} errorCodeAndMsg
 */
const login = async function login(req) {
  try {
    // Extract email and password
    const { email, password } = req.body;

    // Check if there is no email or password
    if (!email || !password) {
      throw { code: 400, message: 'Please provide email and password' };
    }

    // Query the database to get user information using the email
    const [dbUser] = await db.query('select id, name, email, organization, password from users where email=$1', [email], 'Get user from db by emial for login');

    // If there is such user, extract the information
    if (!dbUser) {
      throw { code: 401, message: 'Please check email and password' };
    }

    // Check the password against the hash
    const passwordCheck = await bcrypt.compare(password, dbUser.password);

    if (!passwordCheck) {
      throw { code: 401, message: 'Please check email and password' };
    }

    // Generate access token and refresh token
    const user = { id: dbUser.id, name: dbUser.name, email, organization: dbUser.organization };

    const accessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });
    const refreshToken = await jwt.sign(user, refreshTokenSecret);

    // Update the database with the new refresh token
    await db.query('update users set refresh_token=$1 where id=$2', [refreshToken, dbUser.id]);

    // Return the access token and the refresh token
    return ({ accessToken, refreshToken });
  } catch (error) {
    const errorMsg = 'Could not login';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function logout
 * @summary Logout of the system to the system
 * @param {*} req http request contains access token and refresh token
 * @returns {object} logoutMsg
 * @throws {object} errorCodeAndMsg
 */
const logout = async function logout(req) {
  try {
    // Extract token and refresh token
    const { token } = req.headers;
    const refreshToken = req.cookies['refresh_token'];

    if (!token || !refreshToken) {
      throw { code: 400, message: 'Please provide token and refresh token' };
    }

    // Verify both tokens
    const tokenVerify = await jwt.verify(token, accessTokenSecret);
    const refreshTokenVerify = await jwt.verify(refreshToken, refreshTokenSecret);

    if (tokenVerify.id != refreshTokenVerify.id) {
      throw { code: 401, message: 'Please provide valid token and refresh token' };
    }

    // Delete refresh token from database
    const [dbUser] = await db.query('update users set refresh_token=$1 where refresh_token=$2 returning id', [null, refreshToken], 'Delete refresh token from database');

    if (dbUser) {
      return ({ 'results': 'Logged out successful' });
    } else {
      throw { code: 500, message: 'Could not delete token' };
    }
  } catch (error) {
    const errorMsg = 'Could not logout';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function renewToken
 * @summary Get new token from refresh token
 * @param {*} req http request contains access token and refresh token
 * @returns {object} credentials new access token and new refresh token
 * @throws {object} errorCodeAndMsg
 */
const renewToken = async function renewToken(req) {
  try {
    // Extract token and refresh token
    const { token } = req.headers;
    const { refreshToken } = req.body;

    if (!token || !refreshToken) {
      throw { code: 400, message: 'Please provide token and refresh token' };
    }

    // Verify both tokens
    const tokenVerify = await jwt.verify(token, accessTokenSecret);
    const refreshTokenVerify = await jwt.verify(refreshToken, refreshTokenSecret);

    // Check the email on both of the tokens
    if (tokenVerify.email === refreshTokenVerify.email) {
      // Check if this refresh token still active in the database
      const [dbUser] = await db.query('select name, email, organization refresh_token from users where refresh_token=$1 and id=$2 and email=$3', [refreshToken, tokenVerify.id, tokenVerify.email], 'Check if this refresh token still active in the database');
      if (dbUser && (dbUser.email === tokenVerify.email)) {
        // Generate a new access token
        const user = { id: refreshTokenVerify.id, name: dbUser.name, email: dbUser.email, organization: dbUser.organization };
        const newAccessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });

        // Generate a new refresh token
        const newRefreshToken = await jwt.sign(user, refreshTokenSecret);
        // Update the database with the new refresh token
        await db.query('update users set refresh_token=$1 where id=$2 returning id', [newRefreshToken, user.id], 'Update the database with the new refresh token');

        // Return new access token and same refresh token
        return ({ 'accessToken': newAccessToken, 'refreshToken': newRefreshToken });
      } else {
        const dbMsg = 'Could not query and verify user';
        logger.error({ dbMsg, dbUser });
        throw { code: 401, message: dbMsg };
      }
    } else {
      throw { code: 401, message: 'Could not verify tokens' };
    }
  } catch (error) {
    const errorMsg = 'Could not generate a new token from existing refresh token';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function renewTokenByCookie
 * @summary Get new token from refresh token cookie
 * @param {*} req http request contains access token and refresh token
 * @returns {object} credentials new access token and new refresh token
 * @throws {object} errorCodeAndMsg
 */
const renewTokenByCookie = async function renewTokenByCookie(req) {
  try {
    // Extract refresh token from cookie
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw { code: 400, message: 'Please provide a refresh token' };
    }

    // Verify refresh token
    const refreshTokenVerify = await jwt.verify(refreshToken, refreshTokenSecret);

    // Check if this refresh token still active in the database
    const [dbUser] = await db.query('select name, email, organization, refresh_token from users where refresh_token=$1 and id=$2 and email=$3', [refreshToken, refreshTokenVerify.id, refreshTokenVerify.email], 'Check if this refresh token still active in the database');
    if (dbUser && dbUser['refresh_token'] === refreshToken) {
      const user = { id: refreshTokenVerify.id, name: dbUser.name, email: dbUser.email, organization: dbUser.organization };
      // Generate a new access token
      const newAccessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });

      // Generate a new refresh token
      const newRefreshToken = await jwt.sign(user, refreshTokenSecret);

      // Update the database with the new refresh token
      await db.query('update users set refresh_token=$1 where id=$2 returning id', [newRefreshToken, user.id], 'Update the database with the new refresh token');

      // Return new access token and same refresh token
      return ({ 'accessToken': newAccessToken, 'refreshToken': newRefreshToken });
    } else {
      const dbMsg = 'Could not verify user token';
      logger.error({ dbMsg, dbUser });
      throw { code: 401, message: dbMsg };
    }
  } catch (error) {
    const errorMsg = 'Could not generate a new token from existing refresh token';
    srcFileErrorHandler(error, errorMsg);
  }
};

/**
 * @function verifyToken
 * @summary Verify token and return user information
 * @param {object} req http request contains access token
 * @returns {object} user information from token
 * @throws {string} errorMsg
 */
const verifyToken = async function verifyToken(req) {
  try {
    const { token } = req.headers;

    if (!token) {
      throw { code: 400, messages: 'Token required' };
    }

    const results = await jwt.verify(token, accessTokenSecret);

    if (!results) {
      throw { code: 401, messages: 'Access denied' };
    }

    return (results);
  } catch (error) {
    const errorMsg = 'Could not verify token';
    srcFileErrorHandler(error, errorMsg);
  }
};

module.exports = {
  register,
  login,
  logout,
  renewToken,
  renewTokenByCookie,
  verifyToken
};
