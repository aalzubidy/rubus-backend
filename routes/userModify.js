const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const express = require('express');
const router = express.Router();
const userModifySrc = require('../src/userModifySrc');
const { callSrcFile } = require('../utils/srcFileAuthorization');

/**
 * @summary Get user information by token
 */
router.get('/user', verifySession(), async (req, res) => {
  callSrcFile(userModifySrc, 'getUser', [], req, res);
});

/**
 * @summary Get user details by id
 */
router.get('/user/id/:id', verifySession(), async (req, res) => {
  const { id } = req.params;
  callSrcFile(userModifySrc, 'getUserByKey', ['id', id], req, res);
});

/**
 * @summary Get user details by email
 */
router.get('/user/email/:email', verifySession(), async (req, res) => {
  const { email } = req.params;
  callSrcFile(userModifySrc, 'getUserByKey', ['email', email], req, res);
});

/**
 * @summary Updating users
 */
router.put('/users', verifySession(), async (req, res) => {
  const {
    name,
    email,
    organization
  } = req.body;
  callSrcFile(userModifySrc, 'updateUser', [name, email, organization], req, res);
});

/**
 * @summary Updating password
 */
router.put('/users/password', verifySession(), async (req, res) => {
  const {
    oldPassword,
    newPassword
  } = req.body;
  callSrcFile(userModifySrc, 'changeUserPassword', [oldPassword, newPassword], req, res);
});

module.exports = router;
