const express = require('express');
const router = express.Router();
const { logger } = require('../src/logger');
const authorizationSrc = require('../src/authorizationSrc');
const convertedQuerySrc = require('../src/convertedQuerySrc');

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
    const data = await convertedQuerySrc[functionName].apply(this, [...parameters, user]);
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
 * @summary Store new converted query
 */
router.post('/convertedQuery', async (req, res) => {
  const {
    inputQuery,
    outputQuery
  } = req.body;
  callSrcFile('storeConvertedQuery', [inputQuery, outputQuery], req, res);
});

/**
 * @summary Get user's converted queries
 */
router.get('/convertedQuery', async (req, res) => {
  callSrcFile('getConvertedQueries', [], req, res);
});

/**
 * @summary Get a single converted query
 */
router.get('/convertedQuery/:queryId', async (req, res) => {
  const { queryId } = req.params;
  callSrcFile('getConvertedQuery', [queryId], req, res);
});

/**
 * @summary Delete a single converted query
 */
router.delete('/convertedQuery/:queryId', async (req, res) => {
  const { queryId } = req.params;
  callSrcFile('deleteConvertedQuery', [queryId], req, res);
});

module.exports = router;
