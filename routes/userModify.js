const express = require('express');
const authorizationSrc = require('../src/authorizationSrc');
const router = express.Router();
const userModifySrc = require('../src/userModifySrc');

const callSrcFile = async function callSrc(functionName, parameters, req, res) {
  let userCheckPass = false;
  try {
    const user = await authorizationSrc.verifyToken(req);
    userCheckPass = true;
    const data = await userModifySrc[functionName].apply(this, [...parameters, user]);
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
 * @summary Updating users
 */
router.put('/users', async (req, res) => {
  const {
    name,
    email,
    organization
  } = req.body;
  callSrcFile('updateUser', [name, email, organization], req, res);
});

/**
 * @summary Updating password
 */
router.put('/users/password', async (req, res) => {
  const {
    oldPassword,
    newPassword
  } = req.body;
  callSrcFile('changeUserPassword', [oldPassword, newPassword], req, res);
});

module.exports = router;
