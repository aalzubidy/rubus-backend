const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');
const moment = require('moment');
const { logger } = require('../../utils/logger');
const tools = require('../tools');
const userProjectRequest = require('../usersProjectsRequestsSrc');
const publication = require('../publicationSrc');
const bibtexGenerator = require('./bibtexGenerator');
const { logout } = require('../authorizationSrc');
const { srcFileErrorHandler } = require('../../utils/srcFile');

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
    const errorMsg = 'Could not get an ACM token';
    srcFileErrorHandler(error, errorMsg);
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

    $('.issue-item-container').each((i, item) => {
      // Convert item to parsable html
      const htmlItem = cheerio.load(item);

      // Select title element and clean it
      let title = htmlItem('.issue-item__title').text();
      title = title ? title.trim().replace(/\s\s/g, '') : title;

      // Select doi
      let doi = htmlItem('.issue-item__title a').attr('href');
      if (doi && doi.indexOf('proceedings') > 0) {
        return;
      }
      if (doi) {
        doi = doi.startsWith('/doi/') ? doi.substring(5) : doi;
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
    console.log(error);
    const errorMsg = 'Could not get and parse articles from an ACM url';
    srcFileErrorHandler(error, errorMsg);
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
    const errorMsg = 'Could not get ACM articles details';
    srcFileErrorHandler(error, errorMsg);
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
    case 'paper_conference':
      return 'conference paper';
    case 'report':
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
  return authors.toString();
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
    await tools.checkUserInProject(id, projectId);

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
    let failed = 0;
    let skipped = 0;

    // Search all pages and link anything already in the database to the project
    while (status === 'in-progress') {
      // Update the url to parse 50 results in one parse
      if (searchUrl.indexOf('&pageSize=50') <= 0) {
        searchUrl = `${searchUrl}&pageSize=50`;
      } else {
        searchUrl = searchUrl.replace(/pageSize=\d+/gm, '&pageSize=50');
      }

      logger.debug({ label: 'searchUrl after chaning page size', searchUrl });

      // Go to a url and get all the DOIs
      const { dois, info } = await parseURLArticles(searchUrl, token, user);
      const { totalResults, showingResultsFrom, showingResultsTo, currentPage } = info;

      logger.debug({ label: 'current info', info });

      if (!dois || dois.length <= 0) {
        status = 'failed';
        return;
      }

      // Check if the doi in the database or the doi is needed
      // If it is in the db, then link it to the project
      for await (const doi of dois) {
        let publicationInfo = null;
        try {
          publicationInfo = await publication.getPublicationByDOI(doi, user);
          if (publicationInfo && publicationInfo.id) {
            await publication.addPublicationToProjectById(publicationInfo.id, projectId, searchQueryId);
            completed += 1;
          } else {
            if (doisNeeded.indexOf(doi) < 0) {
              doisNeeded.push(doi);
            }
          }
        } catch (error) {
          if (doisNeeded.indexOf(doi) < 0 && !publicationInfo && !publicationInfo.id) {
            doisNeeded.push(doi);
          } else {
            skipped += 1;
          }
        }
      }

      // logger.debug({ label: 'dois needed', 'doisNeeded length': doisNeeded.length, doisNeeded });

      // Update user project request information
      const userProjectRequestUpdate = {
        total: parseInt(totalResults, 10),
        completed: parseInt(completed, 10),
        failed: parseInt(failed, 10),
        skipped: parseInt(skipped, 10),
      };
      await userProjectRequest.modifyUserProjectRequest(requestId, userProjectRequestUpdate, projectId, user);

      // Get user project request status
      status = await userProjectRequest.getUserProjectRequestById(requestId, projectId, user);
      status = status['status'];

      // Update the url to go to the next page
      if (currentPage.indexOf('&startPage=') <= 0) {
        searchUrl = `${searchUrl}&startPage=0`;
      } else {
        let pageNumber = currentPage.match(/(?<=startPage=)(\d+)/gm)[0];
        pageNumber = parseInt(pageNumber, 10);
        searchUrl = currentPage.replace(/startPage=\d+/gm, `startPage=${pageNumber + 1}`);
      }

      // Check if there is no more pages to parse
      if (showingResultsTo === totalResults || completed + doisNeeded.length >= totalResults) {
        status = 'completed-search';
      }
    }

    logger.debug({ label: 'completed after while is done', completed });
    logger.debug({ label: 'dois needed after while is done', 'doisNeeded length': doisNeeded.length });

    // Check if there are no more dois needed
    if (doisNeeded.length <= 0) {
      // update user project request
      status = 'completed';
      const userProjectRequestUpdate = {
        status,
        completed: parseInt(completed, 10),
        failed: parseInt(failed, 10),
        skipped: parseInt(skipped, 10),
        completed_date: moment.format()
      };
      await userProjectRequest.modifyUserProjectRequest(requestId, userProjectRequestUpdate, projectId, user);
      return { message: 'Search and save for ACM completed' };
    }

    // Request the dois that are not in the database
    const newItems = await getArticlesDetails(doisNeeded, null, user);

    logger.debug({ label: 'new items obtained', 'newItems length': newItems.length });

    // parse them, store them in the database and add them to the project
    for await (const parentItem of newItems) {
      try {
        const itemKey = Object.keys(parentItem)[0];
        const item = parentItem[itemKey];
        // logger.debug({label: 'New item index and key', 'index': index, key: itemKey, item});
        const newPublication = {
          'type': parseType(item['type']),
          'author': item.author ? parseAuthors(item.author) : parseAuthors(item.editor),
          'editor': parseAuthors(item.editor) || null,
          'title': item.title || null,
          'book_title': item['container-title'] || null,
          'year': item.issued && item.issued['date-parts'] && item.issued['date-parts'][0] && item.issued['date-parts'][0][0] ? item.issued['date-parts'][0][0].toString() : null,
          'publisher': item.publisher || null,
          'address': item['publisher-place'] || null,
          'pages': item.page.toString() || null,
          'isbn': item.ISBN || null,
          'doi': itemKey || item.id,
          'url': item.url || item.URL || `https://dl.acm.org/doi/${itemKey}`,
          'journal': item['container-title'] || null,
          'volume': item.volume || null,
          'abstract': item.abstract || null,
          'issn': item.ISSN || null,
          'location': item['publisher-place'] || null,
          'keywords': item.keyword || null,
          'month': item.month || null,
          'obtained_bibtex': item,
          'generated_bibtex': bibtexGenerator.generateBibtex(item),
          'create_date': moment().format()
        };
        // logger.debug({ label: 'New publication is ready for db', newPublication });
        const newPublicationInfo = await publication.newPublication(newPublication, user);
        if (newPublicationInfo.id) {
          await publication.addPublicationToProjectById([newPublicationInfo.id], projectId, searchQueryId, user);
          completed += 1;
        } else {
          skipped += 1;
        }
      } catch (error) {
        failed += 1;
      }
    }

    // Update user project request
    status = 'completed';
    const userProjectRequestUpdate = {
      status,
      completed: parseInt(completed, 10),
      failed: parseInt(failed, 10),
      skipped: parseInt(skipped, 10),
      completed_date: moment().format()
    };
    await userProjectRequest.modifyUserProjectRequest(requestId, userProjectRequestUpdate, projectId, user);

    return { message: 'Search and save for ACM completed' };
  } catch (error) {
    console.log(error);
    const errorMsg = 'Could not search and save all results from ACM';
    srcFileErrorHandler(error, errorMsg);
  }
};

module.exports = {
  getToken,
  parseURLArticles,
  getArticlesDetails,
  searchAndSave
};
