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
    
    const email = req.user.email;
    
    const user = { name: email };

    const accessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '30m' });
    const refreshToken = await jwt.sign(user, refreshTokenSecret);

    const results = await db.query('update users set refresh_token=$1 where email=$2', [refreshToken, email]);
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
    const results = await db.query('delete from users where refresh_token=$1', [req.refreshToken]);
    if (results) {
      res.json({ accessToken, refreshToken });
    } else {
      const dbMsg = 'Could not update users for logout';
      console.log(dbMsg);
      console.log(results);
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
app.post('/token', (req, res) => {
  try {
    const results = await db.query('select * from users where refresh_token=$1', [req.refreshToken]);
    if (results && results.row[0]) {
      jwt.verify(req.refreshToken, refreshTokenSecret, (err, user) => {
        if (err) {
          const tokenErrorMsg = 'Could not verify exiting refresh token';
          console.log(tokenErrorMsg);
          console.log(err);
          throw tokenErrorMsg;
        } else {
          const accessToken = jwt.sign(user.email, accessTokenSecret, { expiresIn: '30m' });
          res.json({ accessToken });
        }
      })
      res.json({ accessToken, refreshToken });
    } else {
      const dbMsg = 'Could not query or update users for new token';
      console.log(dbMsg);
      console.log(results);
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
