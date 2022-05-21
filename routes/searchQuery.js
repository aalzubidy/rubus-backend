const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const express = require('express');
const router = express.Router();
const searchQuerySrc = require('../src/searchQuerySrc');
const { callSrcFile } = require('../utils/srcFileAuthorization');

/**
 * @summary Store new converted query
 */
router.post('/searchQuery', verifySession(), async (req, res) => {
  const {
    inputQuery,
    dbName,
    totalResults,
    projectId
  } = req.body;
  callSrcFile(searchQuerySrc, 'storeSearchQuery', [inputQuery, dbName, totalResults, projectId], req, res);
});

/**
 * @summary Get user's search queries
 */
router.get('/searchQuery', verifySession(), async (req, res) => {
  callSrcFile(searchQuerySrc, 'getSearchQueries', [], req, res);
});

/**
 * @summary Get project's search queries
 */
router.get('/searchQuery/project/:projectId', verifySession(), async (req, res) => {
  const { projectId } = req.params;
  callSrcFile(searchQuerySrc, 'getProjectSearchQueries', [projectId], req, res);
});

/**
 * @summary Get a single search query
 */
router.get('/searchQuery/:queryId/project/:projectId', verifySession(), async (req, res) => {
  const { queryId, projectId } = req.params;
  callSrcFile(searchQuerySrc, 'getSearchQuery', [queryId, projectId], req, res);
});

/**
 * @summary Delete a single search query
 */
router.delete('/searchQuery/:queryId/project/:projectId', verifySession(), async (req, res) => {
  const { queryId, projectId } = req.params;
  callSrcFile(searchQuerySrc, 'deleteSearchQuery', [queryId, projectId], req, res);
});

module.exports = router;
