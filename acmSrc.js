const axios = require('axios');

const test = async function test() {
  let cookieString = await axios('https://dl.acm.org/');
  cookieString = cookieString['headers']['set-cookie'][0];

  const results = await axios.get('https://dl.acm.org/action/doSearch?AllField=Software+AND+%28Quality+OR+Testing%29+NOT+Mobile', {
    headers: {
      'Cookie': cookieString
    }
  });
  console.log(results.data);
};

test();


// const cheerio = require('cheerio')
// const $ = cheerio.load('<h2 class="title">Hello world</h2>')

// const titleText = $('h2.title').text();