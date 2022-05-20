// Import test modules
const { expect } = require('chai');
const td = require('testdouble');
const anything = td.matchers.anything();

// Import files
const stringTools = require('../../../utils/stringTools');
const db = require('../../../utils/db');

describe('stringTools.js', function () {
  beforeEach(function () {
    td.replace(db, 'query');
  });

  afterEach(function () {
    td.reset();
  });

  describe('titleCase', function () {
    it('should return correct title case', function () {
      try {
        const results = stringTools.titleCase('hello world!');
        expect(results).equal('Hello World!');
      } catch (error) {
        expect(error).to.be.null;
      }
    });
    it('should return the same title if there is an error', function () {
      try {
        const results = stringTools.titleCase([]);
        expect(results).deep.equal([]);
      } catch (error) {
        expect(error).to.be.null;
      }
    });
  });

});
