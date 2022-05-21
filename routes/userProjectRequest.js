const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const express = require('express');
const router = express.Router();
const usersProjectsRequestsSrc = require('../src/usersProjectsRequestsSrc');
const { callSrcFile } = require('../utils/srcFileAuthorization');

/**
 * @summary Create new user project request
 */
router.post('/userProjectRequest', verifySession(), async (req, res) => {
  const {
    userProjectRequest
  } = req.body;
  callSrcFile(usersProjectsRequestsSrc, 'newUserProjectRequest', [userProjectRequest], req, res);
});

/**
 * @summary Delete a user project request
 */
router.delete('/userProjectRequest/:projectId/:userProjectRequestId', verifySession(), async (req, res) => {
  const {
    userProjectRequestId,
    projectId
  } = req.params;
  callSrcFile(usersProjectsRequestsSrc, 'deleteUserProjectRequest', [userProjectRequestId, projectId], req, res);
});

/**
 * @summary Modify a user project request
 */
router.put('/userProjectRequest/:projectId/:userProjectRequestId', verifySession(), async (req, res) => {
  const {
    userProjectRequestId,
    projectId
  } = req.params;
  const { userProjectRequest } = req.body;
  callSrcFile(usersProjectsRequestsSrc, 'modifyUserProjectRequest', [userProjectRequestId, userProjectRequest, projectId], req, res);
});

/**
 * @summary Get a user project request by id
 */
router.get('/userProjectRequest/:projectId/:userProjectRequestId', verifySession(), async (req, res) => {
  const {
    userProjectRequestId,
    projectId
  } = req.params;
  callSrcFile(usersProjectsRequestsSrc, 'getUserProjectRequestById', [userProjectRequestId, projectId], req, res);
});

/**
 * @summary Get a user project request by project id
 */
router.get('/userProjectRequest/:projectId', verifySession(), async (req, res) => {
  const {
    projectId
  } = req.params;
  callSrcFile(usersProjectsRequestsSrc, 'getUserProjectRequestByProjectId', [projectId], req, res);
});

module.exports = router;
