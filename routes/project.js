const express = require('express');
const router = express.Router();
const authorizationSrc = require('../src/authorizationSrc');
const projectSrc = require('../src/projectSrc');

/**
 * @summary Create new project
 */
router.post('/newProject', async (req, res) => {
  try {
    const user = await authorizationSrc.verifyToken(req);
    const data = await projectSrc.newProject(req, user);
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
 * @summary Get user's projects
 */
router.get('/projects', async (req, res) => {
  try {
    const user = await authorizationSrc.verifyToken(req);
    const data = await projectSrc.getProjects(user);
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
 * @summary Get a single project
 */
router.get('/projects/:projectId', async (req, res) => {
  try {
    const user = await authorizationSrc.verifyToken(req);
    const data = await projectSrc.getProject(req, user);
    res.status(200).json({
      data
    });
  } catch (error) {
    res.status(error.code).json({
      error
    });
  }
});

module.exports = router;
