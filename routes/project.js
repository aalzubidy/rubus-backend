const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const express = require('express');
const router = express.Router();
const projectSrc = require('../src/projectSrc');
const { callSrcFile } = require('../utils/srcFileAuthorization');

/**
 * @summary Create new project
 */
router.post('/projects', verifySession(), async (req, res) => {
  const {
    title,
    description
  } = req.body;
  callSrcFile(projectSrc, 'newProject', [title, description], req, res);
});

/**
 * @summary Get user's projects
 */
router.get('/projects', verifySession(), async (req, res) => {
  callSrcFile(projectSrc, 'getProjects', [], req, res);
});

/**
 * @summary Get a single project
 */
router.get('/projects/:projectId', verifySession(), async (req, res) => {
  const { projectId } = req.params;
  callSrcFile(projectSrc, 'getProject', [projectId], req, res);
});

/**
 * @summary Get project admin id
 */
router.get('/projects/:projectId/admin', verifySession(), async (req, res) => {
  const { projectId } = req.params;
  callSrcFile(projectSrc, 'getProjectAdminId', [projectId], req, res);
});

/**
 * @summary Delete a single project
 */
router.delete('/projects/:projectId', verifySession(), async (req, res) => {
  const { projectId } = req.params;
  callSrcFile(projectSrc, 'deleteProject', [projectId], req, res);
});

/**
 * @summary Update project title and description
 */
router.put('/projects/:projectId', verifySession(), async (req, res) => {
  const { projectId } = req.params;
  const { title, description } = req.body;
  callSrcFile(projectSrc, 'updateProject', [projectId, title, description], req, res);
});

/**
 * @summary Add project's user(s)
 */
router.post('/projects/:projectId/addUsers', verifySession(), async (req, res) => {
  const { projectId } = req.params;
  const { projectUsers } = req.body;
  callSrcFile(projectSrc, 'addProjectUsers', [projectId, projectUsers], req, res);
});

/**
 * @summary Remove project's user(s)
 */
router.delete('/projects/:projectId/removeUsers', verifySession(), async (req, res) => {
  const { projectId } = req.params;
  const { projectUsers } = req.body;
  callSrcFile(projectSrc, 'removeProjectUsers', [projectId, projectUsers], req, res);
});

module.exports = router;
