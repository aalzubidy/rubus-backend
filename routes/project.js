const express = require('express');
const router = express.Router();
const authorizationSrc = require('../src/authorizationSrc');
const projectSrc = require('../src/projectSrc');

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
    const data = await projectSrc[functionName].apply(this, [...parameters, user]);
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
 * @summary Create new project
 */
router.post('/newProject', async (req, res) => {
  const {
    title,
    description
  } = req.body;
  callSrcFile('newProject', [title, description], req, res);
});

/**
 * @summary Get user's projects
 */
router.get('/projects', async (req, res) => {
  callSrcFile('getProjects', [], req, res);
});

/**
 * @summary Get a single project
 */
router.get('/projects/:projectId', async (req, res) => {
  const { projectId } = req.params;
  callSrcFile('getProject', [req], req, res);
});

/**
 * @summary Delete a single project
 */
router.delete('/projects/:projectId', async (req, res) => {
  const { projectId } = req.params;
  callSrcFile('deleteProject', [projectId], req, res);
});

/**
 * @summary Get project admin id
 */
router.get('/projects/:projectId/admin', async (req, res) => {
  const { projectId } = req.params;
  callSrcFile('getProjectAdminId', [projectId], req, res);
});

/**
 * @summary Update project title and description
 */
router.put('/projects/:projectId', async (req, res) => {
  const { projectId } = req.params;
  const { title, description } = req.body;
  callSrcFile('updateProject', [projectId, title, description], req, res);
});

/**
 * @summary Add project's user(s)
 */
router.put('/projects/addUsers', async (req, res) => {
  const { projectId, projectUsers } = req.body;
  callSrcFile('addProjectUsers', [projectId, projectUsers], req, res);
});

/**
 * @summary Remove project's user(s)
 */
router.put('/projects/removeUsers', async (req, res) => {
  const { projectId, projectUsers } = req.body;
  callSrcFile('removeProjectUsers', [projectId, projectUsers], req, res);
});

module.exports = router;
