const express = require('express');
const router = express.Router();
const authorizationSrc = require('../src/authorizationSrc');
const usersProjectsRequestsSrc = require('../src/usersProjectsRequestsSrc');

/**
 * Custom function to call src file
 * @param {string} srcFunctionName source file function name
 * @param {array} parameters Variables to send with the function
 * @returns {object} response
 */
const callSrcFile = async function callSrc(functionName, parameters, req, res) {
  let userCheckPass = false;
  try {
    const user = await authorizationSrc.verifyToken(req);
    userCheckPass = true;
    const data = await usersProjectsRequestsSrc[functionName].apply(this, [...parameters, user]);
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
 * @summary Create new user project request
 */
router.post('/userProjectRequest', async (req, res) => {
  const {
    userProjectRequest
  } = req.body;
  callSrcFile('newUserProjectRequest', [userProjectRequest], req, res);
});

/**
 * @summary Delete a user project request
 */
router.delete('/userProjectRequest', async (req, res) => {
  const {
    userProjectRequestId,
    projectId
  } = req.body;
  callSrcFile('deleteUserProjectRequest', [userProjectRequestId, projectId], req, res);
});

/**
 * @summary Modify a user project request
 */
router.put('/userProjectRequest', async (req, res) => {
  const {
    userProjectRequestId,
    userProjectRequest,
    projectId
  } = req.body;
  callSrcFile('modifyUserProjectRequest', [userProjectRequestId, userProjectRequest, projectId], req, res);
});

/**
 * @summary Get a user project request by id
 */
router.get('/userProjectRequest/:projectId/:userProjectRequestId', async (req, res) => {
  const {
    userProjectRequestId,
    projectId
  } = req.params;
  callSrcFile('getUserProjectRequestById', [userProjectRequestId, projectId], req, res);
});

/**
 * @summary Get a user project request by project id
 */
router.get('/userProjectRequest/:projectId', async (req, res) => {
  const {
    projectId
  } = req.params;
  callSrcFile('getUserProjectRequestByProjectId', [projectId], req, res);
});

module.exports = router;
