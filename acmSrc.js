const axios = require('axios');
const {
  html
} = require('cheerio');
const cheerio = require('cheerio');
const FormData = require('form-data');
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

const buildBibtex = async function buildBibtex(bibtexRequest) {
  // To-Do
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

const parseAuthors = function parseAuthors(author, type){
   if(type && type.toLower() === 'article'){
      
   }
   return authorParsed;
}

const acmArticle = function acmArticle(item) {
  const bibtex = `@article{${item.id},
      author = {${parseAuthors(item.author)}},
      title = {${item.title}},
      year = {${item.issued && item.issued['date-parts'] ? item.issued['date-parts'][0] : null}},
      issue_date = {${item.source}},
      publisher = {${item.publisher}},
      address = {${item['publisher-place']}},
      volume = {${item.volume}},
      number = {${item.issue}},
      issn = {${item['ISSN']}},
      url = {${item['URL']}},
      doi = {${item.id}},
      abstract = {${item.abstract}},
      journal = {${item['container-title']}},
      month = jan,
      pages = {${item.page}},
      numpages = {${item['number-of-pages']}}
   }`;
  return bibtex;
};

// getURLSearchArticles('123');
// getBibtexRequest(['10.5555/911891'], '123');

const articleTest = {
  "10.1145/1188913.1188915": {
    "id": "10.1145/1188913.1188915",
    "type": "ARTICLE",
    "author": [{
      "family": "Abril",
      "given": "Patricia S."
    }, {
      "family": "Plant",
      "given": "Robert"
    }],
    "issued": {
      "date-parts": [
        [2007, 1, 1]
      ]
    },
    "abstract": "The current patent process in many ways works against IT innovation by making the road to realization too dispiriting for today's independent inventors.",
    "call-number": "10.1145/1188913.1188915",
    "container-title": "Commun. ACM",
    "DOI": "10.1145/1188913.1188915",
    "ISSN": "0001-0782",
    "issue": "1",
    "number-of-pages": "9",
    "page": "36–44",
    "publisher": "Association for Computing Machinery",
    "publisher-place": "New York, NY, USA",
    "source": "January 2007",
    "title": "The patent holder's dilemma: buy, sell, or troll?",
    "URL": "https://doi.org/10.1145/1188913.1188915",
    "volume": "50"
  }
};

acmArticle(articleTest);