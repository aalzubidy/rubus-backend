const axios = require('axios');
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
  // console.log($('.issue-item__title').text());

  $('.issue-item-container').each((i, item)=>{
    const htmlItem = cheerio.load(item); 
    const title = htmlItem('.issue-item__title').text();
    
    console.log(i,title);
  });

  // $('.issue-item__title').each((i, item)=>{
  //   try {
  //     console.log(item);
  //   } catch (error) {
  //     console.log('next');
  //   }
  // });
};

test();
