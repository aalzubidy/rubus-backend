// // const moment = require('moment');

// // console.log(moment().format('MM/DD/YYYY'));

// const bcrypt = require('bcrypt');

// test = async () => {
//     const results = await bcrypt.hash('somePassword', 12);
//     console.log(results);
// }

// test();

// -- update test set email = (select email ) || '{a@a.com, b@b.com}' where name='ahmed';

// update test set email = (select ARRAY(SELECT DISTINCT UNNEST(email || '{a@a.com, b@b.com, c@c.com}')) from test) where name='ahmed';

// select * from test;

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

// https://google.github.io/styleguide/jsoncstyleguide.xml

const Ajv = require("ajv");
const moment = require('moment');
const publicationSchema = require('./schemas/publicationSchema.json');
const usersProjectsRequestSchema = require('./schemas/usersProjectsRequestSchema.json');
const usersProjectsRequestSchemaOptional = require('./schemas/usersProjectsRequestSchemaOptional.json');

// async function test() {
  // var ajv = new Ajv();

  // const schemaValidation = await ajv.validate(publicationSchema, {
  //   "type": "",
  //   "author": "",
  //   "title": "",
  //   "doi": "",
  //   "url": "",
  // });

  // console.log(schemaValidation)
  // console.log(ajv.errors)
// }

async function test(){

  const userProjectRequest = {
    "user_id": 123,
    "project_id": 123,
    "status": "in-progress",
    "type": "search and save"
  };

  const userProjectRequestId = 1234;


  try {
    // Check if there is no user project request
    if (!userProjectRequest) {
      throw { code: 400, message: 'Please provide a user project request to modify' };
    }

    // Check user project request object schema
    const ajv = new Ajv();
    const schemaValidation = await ajv.validate(usersProjectsRequestSchemaOptional, userProjectRequest);

    if (!schemaValidation) {
      throw { code: 400, message: 'Please provide correct user project request format to modify, schema failed to validate.' };
    }

    // Build dynamic insert query
    const userProjectRequestKeys = Object.keys(userProjectRequest);
    const userProjectRequestKeysCount = [];
    const userProjectRequestValues = [];
    userProjectRequestKeys.forEach((k, i) => {
      userProjectRequestKeysCount.push(`${k}=$${i+2}`);
      userProjectRequestValues.push(userProjectRequest[k]);
    });
    const queryLine = `update users_projects_requests set ${userProjectRequestKeysCount.toString().replace(/\,/gm, ' ')} where id=$1`;

    // Add user project request id to the beignning of values
    userProjectRequestValues.unshift(userProjectRequestId);

    // Create a user project request in the database
    console.log(queryLine);
    console.log(userProjectRequestValues);
    // await db.query(queryLine, userProjectRequestValues);

    return { message: 'User project request modified successfully' };
  } catch (error) {
    if (error.code) {
      console.log(error);
      throw error;
    }
    const userMsg = 'Could not modify user project request';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
}

test()
