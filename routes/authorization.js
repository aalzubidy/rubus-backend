const express = require("express");
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const router = express.Router();

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

/**
 * @summary validate user, login and return a token and refresh token
 */
router.post('/login', async (req, res) => {
  try {
    // Login process to check username/password and update username below

    const id = '1';
    const name = 'Test User';
    const email = 'a@a.com';

    const user = { id, name, email };

    const accessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });
    const refreshToken = await jwt.sign(user, refreshTokenSecret);

    const results = await db.query('update users set refresh_token=$1 where id=$2', [refreshToken, id]);
    if (results) {
      res.json({ accessToken, refreshToken });
    } else {
      const dbMsg = 'Could not update users';
      console.log(dbMsg);
      console.log(results);
      throw dbMsg;
    }
  } catch (error) {
    const errorMsg = 'Could not login';
    console.log(errorMsg);
    console.log(error);
    res.send(500, errorMsg);
  }
});

/**
 * @summary Logout and delet the stored refresh token
 */
app.delete('/logout', async (req, res) => {
  try {
    const accessResults = await jwt.verify(req.body.accessToken, accessTokenSecret);
    const refreshResults = await jwt.verify(req.body.refreshToken, refreshTokenSecret);
    if (accessResults.user.email === refreshResults.user.email) {
      const dbResults = await db.query('delete from users where refresh_token=$1', [req.body.refreshToken]);
      if (dbResults) {
        res.json({ 'results': 'success' });
      } else {
        const dbMsg = 'Could not update users for logout';
        console.log(dbMsg);
        console.log(dbResults);
        throw dbMsg;
      }
    } else {
      const dbMsg = 'Could not verify tokens';
      console.log(dbMsg);
      console.log(dbResults);
      throw dbMsg;
    }
  } catch (error) {
    const errorMsg = 'Could not logout';
    console.log(errorMsg);
    console.log(error);
    res.send(500, errorMsg);
  }
})

/**
 * @summary Get a new access token using existing refresh token
 */
app.post('/token', async (req, res) => {
  try {
    const accessResults = await jwt.verify(req.body.accessToken, accessTokenSecret);
    const refreshResults = await jwt.verify(req.body.refreshToken, refreshTokenSecret);
    if (accessResults.user.email === refreshResults.user.email) {
      const queryResults = await db.query('select id, name, email from users where refresh_token=$1', [req.body.refreshToken]);
      if (queryResults && queryResults.row[0] && (queryResults.row[0].email === accessResults.user.email)) {
        const user = { id: queryResults.row[0].id, name: queryResults.row[0].name, email: queryResults.row[0].email }
        const newAccessToken = await jwt.sign(user, accessTokenSecret);
        res.json({ 'accessToken': newAccessToken, 'refreshToken': req.body.refreshToken });
      } else {
        const dbMsg = 'Could not query and verify user';
        console.log(dbMsg);
        console.log(dbResults);
        throw dbMsg;
      }
    } else {
      const dbMsg = 'Could not verify tokens';
      console.log(dbMsg);
      console.log(dbResults);
      throw dbMsg;
    }
  } catch (error) {
    const errorMsg = 'Could not generate a new token from existing refresh token';
    console.log(errorMsg);
    console.log(error);
    res.send(500, errorMsg);
  }
})

module.exports = router;
