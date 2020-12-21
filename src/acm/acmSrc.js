const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const moment = require('moment');
const { logger } = require('../logger');
const tools = require('../tools');
const userProjectRequest = require('../usersProjectsRequestsSrc');
const publication = require('../publicationSrc');
const bibtexGenerator = require('./bibtexGenerator');

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
 * @function parseType
 * @summary Parse the type field in articles from ACM
 * @param {string} type Type
 * @returns {string} typeParsed
 */
const parseType = function parseType(type) {
  if (!type) {
    return 'misc';
  }

  switch (type.toLowerCase()) {
    case 'article':
      return 'article';
    case 'book':
      return 'book';
    case 'thesis':
      return 'thesis';
    case 'PAPER_CONFERENCE':
      return 'conference paper';
    case 'REPORT':
      return 'technical report';
    default:
      return 'misc';
  }
};

/**
 * @function parseAuthors
 * @summary Parse the author field in articles from ACM
 * @param {string} author Author
 * @returns {string} authorParsed
 */
const parseAuthors = function paraseAuthors(author) {
  if (!author) {
    return null;
  }

  const authors = [];
  author.forEach((item) => {
    authors.push(`${item.given} ${item.family}`);
  });
  return authors;
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
    await tools.checkUserProjectPermission(id, projectId);

    // create a new request and get request id
    const initialUserProjectRequest = {
      user_id: id,
      project_id: projectId,
      status: 'in-progress',
      type: 'search and save',
      search_query_id: searchQueryId ? searchQueryId : null
    };
    const { id: requestId } = await userProjectRequest.newUserProjectRequest(initialUserProjectRequest, user);

    // Get a token
    const { token } = await getToken();

    let status = 'in-progress';

    // List of dois that are not in database yet
    const doisNeeded = [];
    let completed = 0;

    // Search all pages and link anything already in the database to the project
    while (status === 'in-progress') {
      // Go to a url and get all the DOIs
      const { dois, info } = parseURLArticles(searchUrl, token, user);
      const { totalResults, showingResultsFrom, showingResultsTo, currentPage } = info;

      if (!dois || dois.length <= 0) {
        status = 'failed';
        return;
      }

      // Check if the doi in the database or the doi is needed
      // If it is in the db, then link it to the project
      dois.forEach(async (doi) => {
        const publicationInfo = await publication.getPublicationByDOI(doi, user);
        if (publicationInfo) {
          await publication.addPublicationToProjectById(publicationInfo.id, projectId, searchQueryId);
          completed += 1;
        } else {
          doisNeeded.push(doi);
        }
      });

      // Update user project request information
      const userProjectRequestUpdate = {
        total: totalResults,
        completed
      };
      await userProjectRequest.modifyUserProjectRequest(requestId, userProjectRequestUpdate);

      // Check if there is no more pages to parse
      if (showingResultsFrom === showingResultsTo || completed + doisNeeded.length >= totalResults) {
        status = 'completed-search';
        return;
      }

      // Get user project request status
      status = await userProjectRequest.getUserProjectRequestById(requestId);
      status = status['status'];

      // Update the url to go to the next page
      if (currentPage.indexOf('&startPage=') <= 0) {
        searchUrl = `${searchUrl}&startPage=0`;
      } else {
        let pageNumber = currentPage.match(/(?<=startPage=)(\d+)/gm)[0];
        pageNumber = parseInt(pageNumber, 10);
        searchUrl = currentPage.replace(/startPage=\d+/gm, `&startPage=${pageNumber + 1}`);
      }
    }

    // Check if there are no more dois needed
    if (doisNeeded.length <= 0) {
      // update user project request
      status = 'completed';
      const userProjectRequestUpdate = {
        status,
        completed,
        completed_date: moment.format()
      };
      await userProjectRequest.modifyUserProjectRequest(requestId, userProjectRequestUpdate);
      return { message: 'Search and save for ACM completed' };
    }

    // Request the dois that are not in the database
    const newItems = getArticlesDetails(doisNeeded, null, user);

    // parse them, store them in the database and add them to the project
    newItems.forEach(async (itemKey) => {
      const item = newItems[itemKey];
      const newPublication = {
        'type': parseType(item.type),
        'author': item.author ? parseAuthors(item.author) : parseAuthors(item.editor),
        'editor': parseAuthors(item.editor) || null,
        'title': item.title || null,
        'book_title': item['container-title'] || null,
        'year': item.issued && item.issued['date-parts'] && item.issued['date-parts'][0] ? item.issued['date-parts'][0].toString() : null,
        'publisher': item.publisher || null,
        'address': item['publisher-place'] || null,
        'pages': item.page || null,
        'isbn': item.ISBN || null,
        'doi': itemKey || item.id,
        'url': item.url || `https://dl.acm.org/doi/${itemKey}`,
        'journal': item['container-title'] || null,
        'volume': item.volume || null,
        'abstract': item.abstract || null,
        'issn': item.ISSN || null,
        'location': item['publisher-place'] || null,
        'keywords': item.keyword || null,
        'month': item.month || null,
        'obtained_bibtex': item,
        'generated_bibtex': bibtexGenerator.generateBibtex(item),
        'create_date': moment.format()
      };
      const newPublicationInfo = await publication.newPublication(newPublication, user);
      await publication.addPublicationToProjectById(newPublicationInfo.id, projectId, searchQueryId);
      completed += 1;
    });

    // Update user project request
    status = 'completed';
    const userProjectRequestUpdate = {
      status,
      completed,
      completed_date: moment.format()
    };
    await userProjectRequest.modifyUserProjectRequest(requestId, userProjectRequestUpdate);

    return { message: 'Search and save for ACM completed' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const errorMsg = 'Could not search and save all results from ACM';
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
