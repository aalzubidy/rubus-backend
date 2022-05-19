const express = require('express');
const router = express.Router();
const authorizationSrc = require('../src/authorizationSrc');
const { callSrcFile, callSrcFileSkipVerify } = require('../utils/srcFileAuthorization');

/**
 * @summary Register new users
 */
router.post('/register', async (req, res) => {
  callSrcFileSkipVerify(authorizationSrc, 'register', [req], req, res);
});

/**
 * @summary validate user, login and return a token and refresh token
 */
router.post('/login', async (req, res) => {
  callSrcFileSkipVerify(authorizationSrc, 'login', [req], req, res);
});

/**
 * @summary Logout and delete the stored refresh token
 */
router.delete('/logout', async (req, res) => {
  callSrcFile(authorizationSrc, 'logout', [req], req, res, false);
});

/**
 * @summary Get a new access token using existing refresh token
 */
router.post('/renewToken', async (req, res) => {
  callSrcFileSkipVerify(authorizationSrc, 'renewToken', [req], req, res);
});

/**
 * @summary Get a new access token using existing refresh token cookie
 */
router.post('/renewTokenByCookie', async (req, res) => {
  callSrcFileSkipVerify(authorizationSrc, 'renewTokenByCookie', [req], req, res);
});

module.exports = router;
