const express = require('express');
const router = express.Router();
const authorizationSrc = require('../src/authorizationSrc');

/**
 * Custom function to call src file
 * @param {string} srcFunctionName source file function name
 * @param {array} parameters Variables to send with the function
 * @returns {object} response
 */
const callSrcFile = async function callSrc(functionName, parameters, req, res, skipVerify = true) {
  let userCheckPass = false;
  let user = {};
  try {
    if (!skipVerify) {
      user = await authorizationSrc.verifyToken(req);
    }
    userCheckPass = true;
    const data = await authorizationSrc[functionName].apply(this, [...parameters, user]);
    res.status(200).json({
      data
    });
  } catch (error) {
    console.log(error);
    if (error && error.code) {
      res.status(error.code).json({
        error
      });
    } else if (error && !userCheckPass) {
      res.status(401).json({
        error: {
          code: 401,
          message: 'Not authorized'
        }
      });
    } else {
      res.status(500).json({
        error: {
          code: 500,
          message: `Could not process ${req.originalUrl} request`
        }
      });
    }
  }
};

/**
 * @summary Register new users
 */
router.post('/register', async (req, res) => {
  callSrcFile('register', [req], req, res);
});

/**
 * @summary validate user, login and return a token and refresh token
 */
router.post('/login', async (req, res) => {
  callSrcFile('login', [req], req, res);
});

/**
 * @summary Logout and delete the stored refresh token
 */
router.delete('/logout', async (req, res) => {
  callSrcFile('logout', [req], req, res, false);
});

/**
 * @summary Get a new access token using existing refresh token
 */
router.post('/token', async (req, res) => {
  callSrcFile('renewToken', [req], req, res);
});

module.exports = router;
