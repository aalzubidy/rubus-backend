const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const express = require('express');
const router = express.Router();
const convertedQuerySrc = require('../src/convertedQuerySrc');
const { callSrcFile } = require('../utils/srcFileAuthorization');

/**
 * @summary Store new converted query
 */
router.post('/convertedQuery', verifySession(), async (req, res) => {
  const {
    inputQuery,
    outputQuery
  } = req.body;
  callSrcFile(convertedQuerySrc, 'storeConvertedQuery', [inputQuery, outputQuery], req, res);
});

/**
 * @summary Get user's converted queries
 */
router.get('/convertedQuery', verifySession(), async (req, res) => {
  callSrcFile(convertedQuerySrc, 'getConvertedQueries', [], req, res);
});

/**
 * @summary Get a single converted query
 */
router.get('/convertedQuery/:queryId', verifySession(), async (req, res) => {
  const { queryId } = req.params;
  callSrcFile(convertedQuerySrc, 'getConvertedQuery', [queryId], req, res);
});

/**
 * @summary Delete a single converted query
 */
router.delete('/convertedQuery/:queryId', verifySession(), async (req, res) => {
  const { queryId } = req.params;
  callSrcFile(convertedQuerySrc, 'deleteConvertedQuery', [queryId], req, res);
});

module.exports = router;
