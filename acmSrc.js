const axios = require('axios');
const {
  html
} = require('cheerio');
const cheerio = require('cheerio');
const FormData = require('form-data');
const { object } = require('testdouble');
let $ = null;

const getToken = async function getToken() {
  let cookieString = await axios('https://dl.acm.org/');
  cookieString = cookieString['headers']['set-cookie'][0];
  return cookieString;
};

const getURLSearchArticles = async function getURLSearchArticles(token1) {
  const token = await getToken();
  const results = await axios.get('https://dl.acm.org/action/doSearch?AllField=Software+AND+%28Quality+OR+Testing%29+NOT+Mobile', {
    headers: {
      'Cookie': token
    }
  });
  console.log(results.data);
  $ = cheerio.load(results.data);
  //   $ = cheerio.load(testItem);

  const articles = [];

  const dois = [];

  $('.issue-item-container').each((i, item) => {
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

  // console.log(JSON.stringify({ info, articles }));
  console.log({
    info,
    articles,
    dois
  });
};

const getBibtexRequest = async function getBibtexRequest(dois, token1) {
  const token = await getToken();

  const bibtexFormData = new FormData();
  bibtexFormData.append('format', 'bibTex');
  bibtexFormData.append('targetFile', 'custom-bibtex');
  bibtexFormData.append('dois', dois.toString());

  const restCallConfig = {
    method: 'post',
    url: 'https://dl.acm.org/action/exportCiteProcCitation',
    headers: {
      'Cookie': token,
      ...bibtexFormData.getHeaders()
    },
    data: bibtexFormData
  };

  const results = await axios(restCallConfig);

  console.log(JSON.stringify(results.data.items));
};

function titleCase(str) {
  return str.toLowerCase().split(' ').map(function (word) {
    return (word.charAt(0).toUpperCase() + word.slice(1));
  }).join(' ');
}

const parseAuthors = function parseAuthors(author) {
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
  })
  return authorParsed;
}

const acmArticle = function acmArticle(item) {
  item = item[Object.keys(item)[0]];
  let bibtex = `@article{${item.id},
      author = {${parseAuthors(item.author)}},
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
  bibtex = bibtex.replace(/.+?(?=undefined).+,/gm, '');
  bibtex = bibtex.replace(/^\s*$\n/gm, '');
  return bibtex;
};

const acmBook = function acmBook(item) {
  item = item[Object.keys(item)[0]];
  let bibtex = `@book{${item.id},
      author = {${parseAuthors(item.author)}},
      editor = {${parseAuthors(item.editor)}},
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
  bibtex = bibtex.replace(/.+?(?=undefined).+,/gm, '');
  bibtex = bibtex.replace(/^\s*$\n/gm, '');
  return bibtex;
};

const acmPhdThesis = function acmPhdThesis(item) {
  item = item[Object.keys(item)[0]];
  let bibtex = `@phdthesis{${item.id},
      author = {${parseAuthors(item.author)}},
      advisor = {${parseAuthors(item.editor)}},
      title = {${titleCase(item.title)}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      note = {${item['note']}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      abstract = {${item.abstract}},
      doi = {${item.id}},
   }`;
  bibtex = bibtex.replace(/.+?(?=undefined).+,/gm, '');
  bibtex = bibtex.replace(/^\s*$\n/gm, '');
  return bibtex;
};

const acmInproceedings = function acmInproceedings(item) {
  item = item[Object.keys(item)[0]];
  let bibtex = `@inproceedings{${item.id},
      author = {${parseAuthors(item.author)}},
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
  bibtex = bibtex.replace(/.+?(?=undefined).+,/gm, '');
  bibtex = bibtex.replace(/^\s*$\n/gm, '');
  return bibtex;
};

const acmTechnicalReport = function acmTechnicalReport(item) {
  item = item[Object.keys(item)[0]];
  let bibtex = `@techreport{${item.id},
      author = {${parseAuthors(item.author)}},
      title = {${titleCase(item.title)}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      doi = {${item.id}},
      abstract = {${item['abstract']}},
   }`;
  bibtex = bibtex.replace(/.+?(?=undefined).+,/gm, '');
  bibtex = bibtex.replace(/^\s*$\n/gm, '');
  return bibtex;
};

const acmMisc = function acmMisc(item) {
  item = item[Object.keys(item)[0]];
  let bibtex = `@misc{${item.id},
      author = {${parseAuthors(item.author)}},
      editor = {${parseAuthors(item.editor)}},
      title = {${titleCase(item.title)}},
      url = {${item['URL'] || `https://dl.acm.org/doi/${item.id}`}},
      doi = {${item.id}},
   }`;
  bibtex = bibtex.replace(/.+?(?=undefined).+,/gm, '');
  bibtex = bibtex.replace(/^\s*$\n/gm, '');
  return bibtex;
};

// getURLSearchArticles('123');
// getBibtexRequest(['10.5555/911891'], '123');

// console.log(acmArticle(testItem));
// console.log(acmBook(testItem));
// console.log(acmPhdThesis(testItem));
// console.log(acmInproceedings(testItem));
// console.log(acmMisc(testItem));
