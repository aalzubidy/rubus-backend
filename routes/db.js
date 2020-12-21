const express = require('express');
const router = express.Router();
const { logger } = require('../src/logger');
const authorizationSrc = require('../src/authorizationSrc');
const acmSrc = require('../src/acm/acmSrc');

/**
 * Custom function to call src file
 * @param {string} srcFunctionName source file function name
 * @param {array} parameters Variables to send with the function
 * @returns {object} response
 */
const callSrcFile = async function callSrc(fileName, functionName, parameters, req, res) {
  let userCheckPass = false;
  try {
    const user = await authorizationSrc.verifyToken(req);
    userCheckPass = true;
    let data = null;
    if (fileName.toLowerCase('acm')) {
      data = await acmSrc[functionName].apply(this, [...parameters, user]);
    } else {
      throw new Error('The requested database is not supported at the moment');
    }
    res.status(200).json({
      data
    });
  } catch (error) {
    logger.error(error);
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
 * @summary Search database(s)
 */
router.post('/db/search', async (req, res) => {
  const {
    searchUrl,
    dbName
  } = req.body;
  callSrcFile(dbName, 'parseURLArticles', [searchUrl, null], req, res);
});

/**
 * @summary Search and save results from a database(s) to a project
 */
router.post('/db/searchAndSave', async (req, res) => {
  const {
    searchUrl,
    dbName,
    projectId,
    searchQueryId
  } = req.body;
  callSrcFile(dbName, 'searchAndSave', [searchUrl, null], req, res);
});

module.exports = router;
