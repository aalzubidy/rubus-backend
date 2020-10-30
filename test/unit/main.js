const { expect } = require('chai');
const main = require('../../src/main.js');

describe.skip('main.js', function () {
  describe('someFunction', function () {
    it('should return results', function () {
      try {
        const results = main.someFunction();
        expect(results).deep.equals({});
      } catch (error) {
        expect(error).to.be.null;
      }
    })
  })
})