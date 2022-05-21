// Import test modules
const { expect } = require('chai');
const td = require('testdouble');
const anything = td.matchers.anything();

// Import files
const tools = require('../../../src/tools');
const db = require('../../../utils/db');

describe('tools.js', function () {
  beforeEach(function () {
    td.replace(db, 'query');
  });

  afterEach(function () {
    td.reset();
  });

  describe('checkUserProjectPermission', function () {
    it('should return allowed true when there are multiple projects', async function () {
      td.when(db.query(anything, anything, anything)).thenReturn([{ project_id: [123] }]);
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
