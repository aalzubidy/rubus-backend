const express = require('express');
const router = express.Router();
const { logger } = require('../src/logger');
const authorizationSrc = require('../src/authorizationSrc');
const publicationSrc = require('../src/publicationSrc');

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
    const data = await publicationSrc[functionName].apply(this, [...parameters, user]);
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
 * @summary Create new publication
 */
router.post('/publications', async (req, res) => {
  const {
    publication
  } = req.body;
  callSrcFile('newPublication', [publication], req, res);
});

/**
 * @summary Delete publication(s) by DOI
 */
router.delete('/publications/doi', async (req, res) => {
  const {
    dois
  } = req.body;
  callSrcFile('deletePublicationByDOI', [dois], req, res);
});

/**
 * @summary Delete publication(s) by Id
 */
router.delete('/publications/id', async (req, res) => {
  const {
    publicationIds
  } = req.body;
  callSrcFile('deletePublicationById', [publicationIds], req, res);
});

/**
 * @summary Add publication(s) by DOI to a project
 */
router.post('/publications/project/doi', async (req, res) => {
  const {
    dois,
    projectId,
    searchQueryId
  } = req.body;
  callSrcFile('addPublicationToProjectByDoi', [dois, projectId, searchQueryId], req, res);
});

/**
 * @summary Add publication(s) by Id to a project
 */
router.post('/publications/project/id', async (req, res) => {
  const {
    publicationIds,
    projectId,
    searchQueryId
  } = req.body;
  callSrcFile('addPublicationToProjectById', [publicationIds, projectId, searchQueryId], req, res);
});

/**
 * @summary Delete publication(s) by DOI from a project
 */
router.delete('/publications/project/doi', async (req, res) => {
  const {
    dois,
    projectId
  } = req.body;
  callSrcFile('deletePublicationFromProjectByDoi', [dois, projectId], req, res);
});

/**
 * @summary Delete publication(s) by id from a project
 */
router.delete('/publications/project/id', async (req, res) => {
  const {
    publicationIds,
    projectId
  } = req.body;
  callSrcFile('deletePublicationFromProjectById', [publicationIds, projectId], req, res);
});

/**
 * @summary Delete all publication(s) from a project
 */
router.delete('/publications/project/all', async (req, res) => {
  const {
    projectId
  } = req.body;
  callSrcFile('deleteAllPublicationsFromProject', [projectId], req, res);
});

module.exports = router;
