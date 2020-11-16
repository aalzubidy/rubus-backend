const express = require("express");
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const router = express.Router();
const bcrypt = require('bcrypt');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

/**
 * @summary validate user, login and return a token and refresh token
 */
router.post('/login', async (req, res) => {
  try {
    // Check if there is no email or password
    if (!req.body.email || !req.body.password) {
      throw 'Please provide email and password';
    }

    // Extract email and password
    const { email } = req.body;
    let { password } = req.body;

    // Query the database to get user information using the email
    let queryResults = await db.query('select id, name, email, password from users where email=$1', [email]);

    // If there is such user, extract the information
    if (queryResults && queryResults.rows[0]) {
      queryResults = queryResults.rows[0];
    } else {
      throw 'Please check email and password';
    }

    // Check the password against the hash
    const passwordCheck = await bcrypt.compare(password, queryResults.password);

    if (!passwordCheck) {
      throw 'Please check email and password';
    }

    // Generate access token and refresh token
    const user = { id: queryResults.id, name: queryResults.name, email };

    const accessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });
    const refreshToken = await jwt.sign(user, refreshTokenSecret);

    // Update the database with the new refresh token
    await db.query('update users set refresh_token=$1 where id=$2', [refreshToken, queryResults.id]);

    // Return the access token and the refresh token
    res.json({ accessToken, refreshToken });
  } catch (error) {
    const errorMsg = 'Could not login :(';
    console.log(errorMsg, error);
    res.status(500).send(errorMsg);
  }
});

/**
 * @summary Logout and delet the stored refresh token
 */
router.delete('/logout', async (req, res) => {
  try {
    // Extract token and refresh token
    const { token } = req.headers;
    const { refreshToken } = req.body;

    if (!token || !refreshToken) {
      throw 'Please provide token and refresh token'
    }

    // Verify both tokens
    const tokenVerify = await jwt.verify(token, accessTokenSecret);
    const refreshTokenVerify = await jwt.verify(refreshToken, refreshTokenSecret);

    if (tokenVerify.id != refreshTokenVerify.id) {
      throw 'Please provide valid token and refresh token'
    }

    // Delete refresj token from database
    const dbResults = await db.query('update users set refresh_token=$1 where refresh_token=$2', [null, refreshToken]);

    if (dbResults) {
      res.json({ 'results': 'Logged out successful' });
    } else {
      throw 'Could not delete token';
    }
  } catch (error) {
    const errorMsg = `Could not logout ${error}`;
    console.log(errorMsg);
    res.status(500).send(errorMsg);
  }
})

/**
 * @summary Get a new access token using existing refresh token
 */
router.post('/token', async (req, res) => {
  try {
    // Extract token and refresh token
    const { token } = req.headers;
    const { refreshToken } = req.body;

    if (!token || !refreshToken) {
      throw 'Please provide token and refresh token'
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
        const user = { id: refreshTokenVerify.id, name: refreshTokenVerify.name, email: refreshTokenVerify.email }
        const newAccessToken = await jwt.sign(user, accessTokenSecret);
        // Return new access token and same refresh token
        res.json({ 'accessToken': newAccessToken, 'refreshToken': refreshToken });
      } else {
        const dbMsg = 'Could not query and verify user';
        console.log(dbMsg);
        console.log(dbResults);
        throw dbMsg;
      }
    } else {
      throw 'Could not verify tokens';
    }
  } catch (error) {
    const errorMsg = 'Could not generate a new token from existing refresh token';
    console.log(errorMsg);
    console.log(error);
    res.status(500).send(errorMsg);
  }
})

module.exports = router;
