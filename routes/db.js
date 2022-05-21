const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const express = require('express');
const router = express.Router();
const acmSrc = require('../src/acm/acmSrc');
const { callSrcFile } = require('../utils/srcFileAuthorization');

/**
 * @summary Search database(s)
 */
router.post('/db/search', verifySession(), async (req, res) => {
  const {
    searchUrl,
    dbName
  } = req.body;
  if (dbName.toLowerCase() === 'acm') callSrcFile(acmSrc, 'parseURLArticles', [searchUrl, null], req, res);
  else res.status(400).send('The requested database is not supported at the moment');
});

/**
 * @summary Search and save results from a database(s) to a project
 */
router.post('/db/searchAndSave', verifySession(), async (req, res) => {
  const {
    searchUrl,
    dbName,
    projectId,
    searchQueryId
  } = req.body;
  if (dbName.toLowerCase() === 'acm') callSrcFile(acmSrc, 'searchAndSave', [searchUrl, projectId, searchQueryId], req, res);
  else res.status(400).send('The requested database is not supported at the moment');
});

module.exports = router;
