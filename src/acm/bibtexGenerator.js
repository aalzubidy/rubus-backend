const { logger } = require('../../utils/logger');
const { srcFileErrorHandler } = require('../../utils/srcFile');

/**
 * @function titleCase
 * @summary Convert a string to title case format
 * @params {string} inputString Input string
 * @returns {string} titleCaseString
 */
const titleCase = function titleCase(inputString) {
  try {
    return inputString.toLowerCase().split(' ').map(function (word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  } catch (error) {
    return inputString;
  }
};

/**
 * @function parseACMAuthors
 * @summary Parse author list to a single line authors
 * @params {array} author List of AMC authors
 * @returns {string} authorParsed
 */
const parseACMAuthors = function parseACMAuthors(author) {
  try {
    if (!author) {
      return undefined;
    }

    let authorParsed = '';
    author.forEach((item, index) => {
      if (index === 0) {
        authorParsed = `${item['family']}, ${item['given']}`;
      } else {
        authorParsed = `${authorParsed} and ${item['family']}, ${item['given']}`;
      }
    });
    return authorParsed;
  } catch (error) {
    if (error.code) {
      logger.error(error);
      throw error;
    }
    const errorMsg = 'Could not parse ACM authors';
    logger.error({ errorMsg, error });
    return undefined;
  }
};

/**
 * @function cleanBibtex
 * @summary Clean extra spaces and undifiend from bibtex
 * @params {string} inputBibtex Input bibtex
 * @returns {string} cleanedBibtex
 */
const cleanBibtex = function cleanBibtex(inputBibtex) {
  try {
    let cleanedBibtex = inputBibtex.replace(/.+?(?=undefined).+,/gm, '');
    cleanedBibtex = cleanBibtex.replace(/^\s*$\n/gm, '');
    return cleanedBibtex;
  } catch (error) {
    return inputBibtex;
  }
};

/**
 * @function acmArticle
 * @summary Generate bibtex for an ACM article
 * @params {object} item ACM article item
 * @returns {string} bibtex
 * @throws {object} errorDetails
 */
const acmArticle = function acmArticle(item) {
  try {
    let bibtex = `@article{${item.id},
      author = {${parseACMAuthors(item.author)}},
      title = {${titleCase(item.title)}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      issue_date = {${item.source}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      volume = {${item.volume}},
      number = {${item.issue}},
      issn = {${item['ISSN']}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      doi = {${item.id}},
      abstract = {${item.abstract}},
      journal = {${item['container-title']}},
      pages = {${item.page}},
      numpages = {${item['number-of-pages']}},
      keywords = {${item['keyword']}},
   }`;
    bibtex = cleanBibtex(bibtex);
    return bibtex;
  } catch (error) {
    if (error.code) {
      logger.error(error);
      throw error;
    }
    const errorMsg = 'Could not generate bibtex for ACM article';
    logger.error({ errorMsg, error });
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @function acmBook
 * @summary Generate bibtex for an ACM book
 * @params {object} item ACM book item
 * @returns {string} bibtex
 * @throws {object} errorDetails
 */
const acmBook = function acmBook(item) {
  try {
    let bibtex = `@book{${item.id},
      author = {${parseACMAuthors(item.author)}},
      editor = {${parseACMAuthors(item.editor)}},
      title = {${titleCase(item.title)}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      isbn = {${item['ISBN']}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      volume = {${item.volume}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      abstract = {${item.abstract}},
      doi = {${item.id}},
      edition = ${item.edition},
   }`;
    bibtex = cleanBibtex(bibtex);
    return bibtex;
  } catch (error) {
    if (error.code) {
      logger.error(error);
      throw error;
    }
    const errorMsg = 'Could not generate bibtex for ACM book';
    logger.error({ errorMsg, error });
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @function acmPhdThesis
 * @summary Generate bibtex for an ACM PhD thesis
 * @params {object} item ACM PhD thesis item
 * @returns {string} bibtex
 * @throws {object} errorDetails
 */
const acmPhdThesis = function acmPhdThesis(item) {
  try {
    let bibtex = `@phdthesis{${item.id},
      author = {${parseACMAuthors(item.author)}},
      advisor = {${parseACMAuthors(item.editor)}},
      title = {${titleCase(item.title)}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      note = {${item['note']}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      abstract = {${item.abstract}},
      doi = {${item.id}},
   }`;
    bibtex = cleanBibtex(bibtex);
    return bibtex;
  } catch (error) {
    if (error.code) {
      logger.error(error);
      throw error;
    }
    const errorMsg = 'Could not generate bibtex for ACM PhD thesis';
    logger.error({ errorMsg, error });
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @function acmInproceedings
 * @summary Generate bibtex for an ACM inproceedings
 * @params {object} item ACM inproceedings item
 * @returns {string} bibtex
 * @throws {object} errorDetails
 */
const acmInproceedings = function acmInproceedings(item) {
  try {
    let bibtex = `@inproceedings{${item.id},
      author = {${parseACMAuthors(item.author)}},
      title = {${titleCase(item.title)}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      isbn = {${item['ISBN']}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      doi = {${item.id}},
      abstract = {${item['abstract']}},
      booktitle = {${item['container-title']}},
      pages = {${item.page}},
      numpages = {${item['number-of-pages']}},
      location = {${item['event-place']}},
      series = {${item['collection-title']}},
   }`;
    bibtex = cleanBibtex(bibtex);
    return bibtex;
  } catch (error) {
    if (error.code) {
      logger.error(error);
      throw error;
    }
    const errorMsg = 'Could not generate bibtex for ACM inproceedings';
    logger.error({ errorMsg, error });
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @function acmTechnicalReport
 * @summary Generate bibtex for an ACM technical report
 * @params {object} item ACM technical report item
 * @returns {string} bibtex
 * @throws {object} errorDetails
 */
const acmTechnicalReport = function acmTechnicalReport(item) {
  try {
    let bibtex = `@techreport{${item.id},
      author = {${parseACMAuthors(item.author)}},
      title = {${titleCase(item.title)}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      doi = {${item.id}},
      abstract = {${item['abstract']}},
   }`;
    bibtex = cleanBibtex(bibtex);
    return bibtex;
  } catch (error) {
    if (error.code) {
      logger.error(error);
      throw error;
    }
    const errorMsg = 'Could not generate bibtex for ACM technical report';
    logger.error({ errorMsg, error });
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @function acmArticle
 * @summary Generate bibtex for an ACM misc item
 * @params {object} item ACM misc item
 * @returns {string} bibtex
 * @throws {object} errorDetails
 */
const acmMisc = function acmMisc(item) {
  try {
    let bibtex = `@misc{${item.id},
      author = {${parseACMAuthors(item.author)}},
      editor = {${parseACMAuthors(item.editor)}},
      title = {${titleCase(item.title)}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      doi = {${item.id}},
   }`;
    bibtex = cleanBibtex(bibtex);
    return bibtex;
  } catch (error) {
    if (error.code) {
      logger.error(error);
      throw error;
    }
    const errorMsg = 'Could not generate bibtex for an ACM misc item';
    logger.error({ errorMsg, error });
    throw { code: 500, message: errorMsg };
  }
};

/**
 * @function generateBibtex
 * @summary Generate bibtex based on item type
 * @param {object} item Item obtained from ACM
 * @returns {string} bibtex
 * @throws {object} errorDetails
 */
const generateBibtex = function generateBibtex(item) {
  if (!item['type']) {
    return (acmMisc(item));
  }

  switch (item['type'].toLowerCase()) {
    case 'article':
      return (acmArticle(item));
    case 'book':
      return (acmBook(item));
    case 'thesis':
      return (acmPhdThesis(item));
    case 'paper_conference':
      return (acmInproceedings(item));
    case 'report':
      return (acmTechnicalReport(item));
    default:
      return (acmMisc(item));
  }
};

module.exports = {
  titleCase,
  parseACMAuthors,
  cleanBibtex,
  acmArticle,
  acmBook,
  acmPhdThesis,
  acmInproceedings,
  acmTechnicalReport,
  acmMisc,
  generateBibtex
};
