const express = require("express");
const router = express.Router();
const authorizationSrc = require('../src/authorizationSrc');

/**
 * @summary Register new users
 */
router.post('/register', async (req, res) => {
  try {
    const data = await authorizationSrc.register(req);
    res.status(200).json({
      data
    });
  } catch (error) {
    res.status(error.code).json({
      error
    });
  }
});


/**
 * @summary validate user, login and return a token and refresh token
 */
router.post('/login', async (req, res) => {
  try {
    const data = await authorizationSrc.login(req);
    res.status(200).json({
      data
    });
  } catch (error) {
    res.status(error.code).json({
      error
    });
  }
});

/**
 * @summary Logout and delete the stored refresh token
 */
router.delete('/logout', async (req, res) => {
  try {
    const data = await authorizationSrc.logout(req);
    res.status(200).json({
      data
    });
  } catch (error) {
    res.status(error.code).json({
      error
    });
  }
})

/**
 * @summary Get a new access token using existing refresh token
 */
router.post('/token', async (req, res) => {
  try {
    const data = await authorizationSrc.renewToken(req);
    res.status(200).json({
      data
    });
  } catch (error) {
    res.status(error.code).json({
      error
    });
  }
})

module.exports = router;
