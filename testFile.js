// const moment = require('moment');

// console.log(moment().format('MM/DD/YYYY'));

const bcrypt = require('bcrypt');

test = async () => {
    const results = await bcrypt.hash('somePassword', 12);
    console.log(results);
}

test();

-- update test set email = (select email ) || '{a@a.com, b@b.com}' where name='ahmed';

update test set email = (select ARRAY(SELECT DISTINCT UNNEST(email || '{a@a.com, b@b.com, c@c.com}')) from test) where name='ahmed';

select * from test;

https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

https://google.github.io/styleguide/jsoncstyleguide.xml