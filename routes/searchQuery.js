const express = require('express');
const router = express.Router();
const authorizationSrc = require('../src/authorizationSrc');
const searchQuerySrc = require('../src/searchQuerySrc');

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
    const data = await searchQuerySrc[functionName].apply(this, [...parameters, user]);
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
 * @summary Store new converted query
 */
router.post('/searchQuery/new', async (req, res) => {
  const {
    inputQuery,
    dbName,
    totalResults,
    projectId
  } = req.body;
  callSrcFile('storeSearchQuery', [inputQuery, dbName, totalResults, projectId], req, res);
});

/**
 * @summary Get user's search queries
 */
router.get('/searchQuery', async (req, res) => {
  callSrcFile('getSearchQueries', [], req, res);
});

/**
 * @summary Get project's search queries
 */
router.get('/searchQuery/project/:projectId', async (req, res) => {
  const { projectId } = req.params;
  callSrcFile('getProjectSearchQueries', [projectId], req, res);
});

/**
 * @summary Get a single search query
 */
router.get('/searchQuery/:queryId/project/:projectId', async (req, res) => {
  const { queryId, projectId } = req.params;
  callSrcFile('getSearchQuery', [queryId, projectId], req, res);
});

/**
 * @summary Delete a single search query
 */
router.delete('/searchQuery/:queryId/project/:projectId', async (req, res) => {
  const { queryId, projectId } = req.params;
  callSrcFile('deleteSearchQuery', [queryId, projectId], req, res);
});

module.exports = router;
