const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const express = require('express');
const router = express.Router();
const publicationSrc = require('../src/publicationSrc');
const { callSrcFile } = require('../utils/srcFileAuthorization');

/**
 * @summary Create new publication
 */
router.post('/publications', verifySession(), async (req, res) => {
  const {
    publication
  } = req.body;
  callSrcFile(publicationSrc, 'newPublication', [publication], req, res);
});

/**
 * @summary Delete publication(s) by DOI
 */
router.delete('/publications/doi', verifySession(), async (req, res) => {
  const {
    dois
  } = req.body;
  callSrcFile(publicationSrc, 'deletePublicationByDOI', [dois], req, res);
});

/**
 * @summary Delete publication(s) by Id
 */
router.delete('/publications/id', verifySession(), async (req, res) => {
  const {
    publicationIds
  } = req.body;
  callSrcFile(publicationSrc, 'deletePublicationById', [publicationIds], req, res);
});

/**
 * @summary Add publication(s) by DOI to a project
 */
router.post('/publications/project/doi', verifySession(), async (req, res) => {
  const {
    dois,
    projectId,
    searchQueryId
  } = req.body;
  callSrcFile(publicationSrc, 'addPublicationToProjectByDoi', [dois, projectId, searchQueryId], req, res);
});

/**
 * @summary Add publication(s) by Id to a project
 */
router.post('/publications/project/id', verifySession(), async (req, res) => {
  const {
    publicationIds,
    projectId,
    searchQueryId
  } = req.body;
  callSrcFile(publicationSrc, 'addPublicationToProjectById', [publicationIds, projectId, searchQueryId], req, res);
});

/**
 * @summary Delete publication(s) by DOI from a project
 */
router.delete('/publications/project/doi', verifySession(), async (req, res) => {
  const {
    dois,
    projectId
  } = req.body;
  callSrcFile(publicationSrc, 'deletePublicationFromProjectByDoi', [dois, projectId], req, res);
});

/**
 * @summary Delete publication(s) by id from a project
 */
router.delete('/publications/project/id', verifySession(), async (req, res) => {
  const {
    publicationIds,
    projectId
  } = req.body;
  callSrcFile(publicationSrc, 'deletePublicationFromProjectById', [publicationIds, projectId], req, res);
});

/**
 * @summary Delete all publication(s) from a project
 */
router.delete('/publications/project/all', verifySession(), async (req, res) => {
  const {
    projectId
  } = req.body;
  callSrcFile(publicationSrc, 'deleteAllPublicationsFromProject', [projectId], req, res);
});

/**
 * @summary Get a publication by id
 */
router.get('/publications/id/:publicationId', verifySession(), async (req, res) => {
  const {
    publicationId
  } = req.params;
  callSrcFile(publicationSrc, 'getPublicationById', [publicationId], req, res);
});

/**
 * @summary Get a publication by doi
 */
router.get('/publications/doi/:publicationDOI', verifySession(), async (req, res) => {
  const {
    publicationDOI
  } = req.params;
  callSrcFile(publicationSrc, 'getPublicationByDOI', [publicationDOI], req, res);
});

/**
 * @summary Get all publications in a project
 */
router.get('/publications/project/:projectId', verifySession(), async (req, res) => {
  const {
    projectId
  } = req.params;
  callSrcFile(publicationSrc, 'getPublicationsByProjectId', [projectId], req, res);
});

module.exports = router;
