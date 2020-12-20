const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const db = require('../../db/db');
const userProjectRequest = require('../usersProjectsRequestsSrc');
const publication = require('../publicationSrc');

// Default values
const acmBaseUrl = 'https://dl.acm.org/';
const acmBaseBibtexUrl = 'https://dl.acm.org/action/exportCiteProcCitation';
let $ = null;

/**
 * @async
 * @function getToken
 * @summary get a token to use in the cookie when calling ACM
 * @returns {object} token
 * @throws {object} errorDetails
 */
const getToken = async function getToken() {
  try {
    let cookieString = await axios(acmBaseUrl);
    cookieString = cookieString['headers']['set-cookie'][0];
    return { token: cookieString };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not get an ACM token';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @async
 * @function parseURLArticles
 * @summary Get list of articles parsed from an ACM url
 * @param {string} acmQueryUrl url to parse
 * @param {string} token Token to use in cookies for ACM
 * @param {object} user User information
 * @returns {object} results
 * @throws {object} errorDetails
 */
const parseURLArticles = async function parseURLArticles(acmQueryUrl, token = null, user) {
  try {
    if (!token) {
      token = await getToken();
      token = token['token'];
    }
    const results = await axios.get(acmQueryUrl, {
      headers: {
        'Cookie': token
      }
    });

    $ = cheerio.load(results.data);

    const articles = [];
    const dois = [];
    $('.issue-item-container').each((item) => {
      // Convert item to parsable html
      const htmlItem = cheerio.load(item);

      // Select title element and clean it
      let title = htmlItem('.issue-item__title').text();
      title = title ? title.trim().replace(/\s\s/g, '') : title;

      // Select doi
      const doi = htmlItem('.issue-item__title a').attr('href');
      if (doi && doi.indexOf('proceedings') > 0) {
        return;
      }
      if (doi) {
        dois.push(doi);
      }

      // Select authors clean it, and split to an array
      let authors = htmlItem('[aria-label="authors"]').text();
      authors = authors ? authors.trim().replace(/\s\s/g, '').replace(/,\s/g, ',').split(',') : authors;

      // Select venue and clean it
      let venue = htmlItem('.issue-item__detail a .epub-section__title').text();
      venue = venue ? venue.trim().replace(/\s\s/g, '') : venue;

      // Select year and clean it
      let year = htmlItem('.issue-item__detail .dot-separator').text();
      if (year) {
        year = year.trim().split(' ');
        year = `${year[0]} ${year[1]}`;
        year = year.indexOf(',') > 0 ? year.substring(0, year.indexOf(',')) : year;
      }

      articles.push({
        doi,
        title,
        authors,
        venue,
        year
      });
    });

    // Parse basic information, total results, displayed results, and current page
    const info = {};
    const showingResults = $('.result__current span').text().trim().split(' ') || null;
    info['showingResultsFrom'] = showingResults[0] || null;
    info['showingResultsTo'] = showingResults[showingResults.length - 1] || null;
    const totalResults = $('.result__count').text().trim().split(' ')[0] || null;
    info['totalResults'] = totalResults.indexOf(',') > 0 ? totalResults.replace(',', '') : totalResults;
    info['currentPage'] = $('[aria-current="page"]').attr('href') || null;
    info['parsedArticlesCount'] = articles.length;

    return ({
      info,
      articles,
      dois
    });
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not get parse articles from an ACM url';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @async
 * @function getArticlesDetails
 * @summary Get articles details to generate bibtex file
 * @param {array} dois List of DOIs to retreive
 * @param {string} token Token to use in cookies for ACM
 * @param {object} user User information
 * @returns {array} results
 * @throws {object} errorDetails
 */
const getArticlesDetails = async function getArticlesDetails(dois, token = null, user) {
  try {
    if (!token) {
      token = await getToken();
      token = token['token'];
    }

    // Build form body for bibtex POST request
    const bibtexFormData = new FormData();
    bibtexFormData.append('format', 'bibTex');
    bibtexFormData.append('targetFile', 'custom-bibtex');
    bibtexFormData.append('dois', dois.toString());

    // POST call to get articles details
    const restCallConfig = {
      method: 'post',
      url: acmBaseBibtexUrl,
      headers: {
        'Cookie': token,
        ...bibtexFormData.getHeaders()
      },
      data: bibtexFormData
    };

    const results = await axios(restCallConfig);
    if (results['data'] && results['data']['items']) {
      return (results.data.items);
    } else {
      throw { code: 500, message: 'Could not get articles details from ACM', results };
    }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not get ACM articles details';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @async
 * @function searchAndSave
 * @summary Search for articles, process them, and save them to a project while updating user projects requests
 * @param {string} searchUrl Search url
 * @param {number} projectId Project id
 * @param {number} searchQueryId Search query id
 * @param {object} user User information
 * @returns {array} results
 * @throws {object} errorDetails
 */
const searchAndSave = async function searchAndSave(searchUrl, projectId, searchQueryId, user) {
  try {
    const { id } = user;

    // Check if the user is allowed to make requests on the project
    const userProjectPermissionQuery = await db.query('select project_id from projects_users where user_id=$1', [id]);
    if (!userProjectPermissionQuery || !userProjectPermissionQuery.rows || !userProjectPermissionQuery.rows[0] || !userProjectPermissionQuery.rows[0].project_id || !userProjectPermissionQuery['rows'][0]['project_id'].includes(projectId)) {
      throw { code: 403, message: 'User does not have requests permissions on selected project.' };
    }

    // create a new request and get request id
    const initialUserProjectRequest = {
      user_id: id,
      project_id: projectId,
      status: 'in-progress',
      type: 'search and save',
      search_query_id: searchQueryId ? searchQueryId : null
    };
    let requestId = await userProjectRequest.newUserProjectRequest(initialUserProjectRequest, user);
    if (!requestId.error && requestId['id']) {
      requestId = requestId['id'];
    } else {
      throw { code: 500, message: 'Could not create user project request for search and save' };
    }

    // Get a token
    let token = await getToken();
    token = token['token'];

    let status = 'in-progress';

    // List of dois already in database
    const doisInDB = [];
    // List of dois that are needed
    const doisNeeded = [];

    while (status === 'in-progress') {
      // Go to a url and get all the DOIs
      const listOfDois = parseURLArticles(searchUrl, token, user);

      if (!listOfDois || !listOfDois.dois || listOfDois.dois.length <= 0) {
        status = 'failed';
        return;
      }

      const { dois, totalResults, parsedArticlesCount } = listOfDois;

      // Check if the doi in the database or the doi is needed
      dois.forEach(async (doi) => {
        const publicationCheck = await publication.getPublicationByDOI(doi, user);
        if (publicationCheck) {
          doisInDB.push(doi);
        } else {
          doisNeeded.push(doi);
        }
      });

      // if it is in the databsae then add it to the project directly
      // if not in the database, download it, parse it, store it in the database and add it to the project
      // update the url and keep going
      //
      // issue a request at the start,
      // update the request by the end
      // always check for the request is not cancelled
    }

    //   // Build form body for bibtex POST request
    //   const bibtexFormData = new FormData();
    //   bibtexFormData.append('format', 'bibTex');
    //   bibtexFormData.append('targetFile', 'custom-bibtex');
    //   bibtexFormData.append('dois', dois.toString());

    //   // POST call to get articles details
    //   const restCallConfig = {
    //     method: 'post',
    //     url: acmBaseBibtexUrl,
    //     headers: {
    //       'Cookie': token,
    //       ...bibtexFormData.getHeaders()
    //     },
    //     data: bibtexFormData
    //   };

    //   const results = await axios(restCallConfig);
    //   if (results['data'] && results['data']['items']) {
    //     return (results.data.items);
    //   } else {
    //     throw { code: 500, message: 'Could not get articles details from ACM', results };
    //   }
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not get ACM articles details';
    console.log(errorMsg, error);
    throw { code: 500, message: errorMsg };
  }
};

module.exports = {
  getToken,
  parseURLArticles,
  getArticlesDetails,
  searchAndSave
};
