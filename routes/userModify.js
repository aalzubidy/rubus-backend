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
router.put('/users/:userid', async (req, res) => {
  const {
    userid
  } = req.params;
  const {
    name,
    email,
    organization,
    password
  } = req.body;

  callSrcFile('updateUser', [userid, name, email, organization, password], req, res);
});

router.delete('/users/:userid/removeUser', async (req, res) => {
  const {
    userid
  } = req.params;
  callSrcFile('removeUser', [userid], req, res);
});

module.exports = router;
