// Import test modules
const { expect } = require('chai');
const td = require('testdouble');
const anything = td.matchers.anything();

// Import files
const tools = require('../../../src/tools');
const db = require('../../../db/db');

describe('tools.js', function () {
  beforeEach(function () {
    td.replace(db, 'query');
  });

  afterEach(function () {
    td.reset();
  });

  // describe('titleCase', function () {
  //   it('should return correct title case', function () {
  //     try {
  //       const results = tools.titleCase('hello world!');
  //       expect(results).equal('Hello World!');
  //     } catch (error) {
  //       expect(error).to.be.null;
  //     }
  //   });
  //   it('should return the same title if there is an error', function () {
  //     try {
  //       const results = tools.titleCase([]);
  //       expect(results).deep.equal([]);
  //     } catch (error) {
  //       expect(error).to.be.null;
  //     }
  //   });
  // });

  describe('checkUserProjectPermission', function () {
    it('should return allowed true when there are multiple projects', async function () {
      td.when(db.query(anything, anything)).thenReturn({ rows: [{ project_id: [123] }] });
      try {
        const results = await tools.checkUserProjectPermission(123, 123);
        expect(results).deep.equal({ allowed: true });
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
  });

});
