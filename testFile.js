// const moment = require('moment');

// console.log(moment().format('MM/DD/YYYY'));

const bcrypt = require('bcrypt');

test = async () => {
    const results = await bcrypt.hash('somePassword', 12);
    console.log(results);
}

test();