const axios = require('axios');
const { html } = require('cheerio');
const cheerio = require('cheerio');
let $ = null;

const test = async function test() {
  let cookieString = await axios('https://dl.acm.org/');
  cookieString = cookieString['headers']['set-cookie'][0];

  const results = await axios.get('https://dl.acm.org/action/doSearch?AllField=Software+AND+%28Quality+OR+Testing%29+NOT+Mobile', {
    headers: {
      'Cookie': cookieString
    }
  });
  $ = cheerio.load(results.data);

  const articles = [];

  $('.issue-item-container').each((i, item)=>{
    const htmlItem = cheerio.load(item);
    const title = htmlItem('.issue-item__title').text();
    const doi = htmlItem('.issue-item__title a').attr('href');
    const authors = htmlItem('[aria-label="authors"]').text().trim().replace(/\s\s/g, '').replace(/,\s/g, ',').split(',');
    const venue = htmlItem('.issue-item__detail a .epub-section__title').text(); 
    let year =  htmlItem('.issue-item__detail .dot-separator').text().trim().split(' ');
    year = `${year[0]} ${year[1]}`;
    year = year.indexOf(',') > 0 ? year.substring(0, year.indexOf(',')) : year;
  
    articles.push({
      doi,
      title,
      authors,
      venue,
      year
    });
  });

//   const htmlItem = cheerio.load(testItem);
//     const title = htmlItem('.issue-item__title').text();
//     const doi = htmlItem('.issue-item__title a').attr('href');
//     const authors = htmlItem('[aria-label="authors"]').text().trim().replace(/\s\s/g, '').split(',');
//     const venue = htmlItem('.issue-item__detail a .epub-section__title').text(); 
//     let year =  htmlItem('.issue-item__detail .dot-separator').text().trim().split(' ');
//     year = `${year[0]} ${year[1]}`;
//     year = year.indexOf(',') > 0 ? year.substring(0, year.indexOf(',')) : year;
  
//     articles.push({
//       doi,
//       title,
//       authors,
//       venue,
//       year
//     });

  console.log(articles);
};

test();
