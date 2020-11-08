const express = require("express");
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const router = express.Router();

/**
 * @summary validate user, login and return a token and refresh token
 */
router.post('/login', async (req, res) => {
  // Login process to check username/password and update username below

  try {
    const email = req.user.email;

    const user = { name: email };

    const accessToken = await jwt.sign(user, accessTokenSecret, { expiresIn: '20m' });
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
})


module.exports = router;