const jwt = require('jsonwebtoken');
const moment = require('moment');
const bcrypt = require('bcrypt');
const { logger } = require('./logger');
const db = require('../db/db');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

/**
 * Register a new user in the system
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
    await db.query('INSERT INTO users(email, password, name, organization, register_ip, create_date) VALUES($1, $2, $3, $4, $5, $6)', [email, hash, name, organization, req.clientIp, createDate]);

    return { message: 'User registered successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not register user';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

/**
 * Login to the system
 * @param {*} req http request contains email and password
 * @returns {object} credientials Access Token and Refresh Token
 * @throws {object} errorCodeAndMsg
 */
const login = async function login(req) {
  try {
    // Check if there is no email or password
    if (!req.body.email || !req.body.password) {
      throw { code: 400, message: 'Please provide email and password' };
    }

    // Extract email and password
    const { email, password } = req.body;

    // Query the database to get user information using the email
    let queryResults = await db.query('select id, name, email, password from users where email=$1', [email]);

    // If there is such user, extract the information
    if (queryResults && queryResults.rows[0]) {
      queryResults = queryResults.rows[0];
    } else {
      throw { code: 401, message: 'Please check email and password' };
    }

    // Check the password against the hash
    const passwordCheck = await bcrypt.compare(password, queryResults.password);

    if (!passwordCheck) {
      throw { code: 401, message: 'Please check email and password' };
    }

    // Generate access token and refresh token
    const user = { id: queryResults.id, name: queryResults.name, email };

    const accessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });
    const refreshToken = await jwt.sign(user, refreshTokenSecret);

    // Update the database with the new refresh token
    await db.query('update users set refresh_token=$1 where id=$2', [refreshToken, queryResults.id]);

    // Return the access token and the refresh token
    return ({ accessToken, refreshToken });
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not login';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

/**
 * Logout of the system to the system
 * @param {*} req http request contains access token and refresh token
 * @returns {object} logoutMsg
 * @throws {object} errorCodeAndMsg
 */
const logout = async function logout(req) {
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

    if (tokenVerify.id != refreshTokenVerify.id) {
      throw { code: 401, message: 'Please provide valid token and refresh token' };
    }

    // Delete refresh token from database
    const dbResults = await db.query('update users set refresh_token=$1 where refresh_token=$2', [null, refreshToken]);

    if (dbResults) {
      return ({ 'results': 'Logged out successful' });
    } else {
      throw { code: 500, message: 'Could not delete token' };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not logout';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

/**
 * Get new token from refresh token
 * @param {*} req http request contains access token and refresh token
 * @returns {object} credentials new access token and original refresh token
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
      const queryResults = await db.query('select email, refresh_token from users where refresh_token=$1', [refreshToken]);
      if (queryResults && queryResults.rows[0] && (queryResults.rows[0].email === tokenVerify.email)) {
        // Generate a new access token
        const user = { id: refreshTokenVerify.id, name: refreshTokenVerify.name, email: refreshTokenVerify.email };
        const newAccessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });
        // Return new access token and same refresh token
        return ({ 'accessToken': newAccessToken, 'refreshToken': refreshToken });
      } else {
        const dbMsg = 'Could not query and verify user';
        console.log(dbMsg, queryResults);
        throw { code: 401, message: dbMsg };
      }
    } else {
      throw { code: 401, message: 'Could not verify tokens' };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not generate a new token from existing refresh token';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

/**
 * Verify token and return user information
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
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not verify token';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

module.exports = {
  register,
  login,
  logout,
  renewToken,
  verifyToken
};
