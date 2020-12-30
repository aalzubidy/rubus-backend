// Import test modules
const {
  expect
} = require('chai');
const td = require('testdouble');
const anything = td.matchers.anything();
const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const bcrypt = require('bcrypt');

// Import files
const convertedQuerySrc = require('../../../src/convertedQuerySrc');
const db = require('../../../db/db');

describe('convertedQuerySrc.js', function () {
  beforeEach(function () {
    td.replace(db, 'query');
  });

  afterEach(function () {
    td.reset();
  });

  describe('storeConvertedQuery', () => {
    it('should return error on missing input or output query', async () => {
      try {
        const results = await convertedQuerySrc.storeConvertedQuery('', '', {});
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide a query and its conversion');
      }
    });
    it('should return error on database error', async () => {
      td.when(db.query(anything, anything)).thenReject('fake error');
      try {
        const results = await convertedQuerySrc.storeConvertedQuery('test input', 'test output', { id: 'test' });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not store query');
      }
    });
    it('should return new query id', async () => {
      td.when(db.query(anything, anything)).thenReturn({
        rows: [{
          id: 1
        }]
      });
      try {
        const results = await convertedQuerySrc.storeConvertedQuery('test', 'test', {
          id: 'test'
        });
        expect(results).deep.equal({
          "message": "Query stored successfully",
          "id": 1
        });
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
  });

  describe('getConvertedQueries', () => {
    it('should return error on empty converted queries', async () => {
      td.when(db.query(anything, anything)).thenReturn({ rows: [] });
      try {
        const results = await convertedQuerySrc.getConvertedQueries({ id: 'test' });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('User does not have any stored converted queries');
      }
    });
    it('should return error on db error', async () => {
      td.when(db.query(anything, anything)).thenReject('fake error');
      try {
        const results = await convertedQuerySrc.getConvertedQueries({ id: 'test' });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not get converted queries');
      }
    });
    it('should return converted queries', async () => {
      td.when(db.query(anything, anything)).thenReturn({
        rows: [{
          "id": 2,
          "input_query": "test query input",
          "output_query": "test query output",
          "create_date": "2020-12-27T08:00:00.000Z",
          "user_id": 74
        }]
      });
      try {
        const results = await convertedQuerySrc.getConvertedQueries('test', 'test', {
          id: 'test'
        });
        expect(results).deep.equal([{
          "id": 2,
          "input_query": "test query input",
          "output_query": "test query output",
          "create_date": "2020-12-27T08:00:00.000Z",
          "user_id": 74
        }]);
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
  });

  describe('getConvertedQuery', () => {
    it('should return error on empty converted query', async () => {
      td.when(db.query(anything, anything)).thenReturn({ rows: [] });
      try {
        const results = await convertedQuerySrc.getConvertedQuery(1, { id: 'test' });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not find user converted query');
      }
    });
    it('should return error on db error', async () => {
      td.when(db.query(anything, anything)).thenReject('fake error');
      try {
        const results = await convertedQuerySrc.getConvertedQuery(1, { id: 'test' });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not get converted query');
      }
    });
    it('should return converted query', async () => {
      td.when(db.query(anything, anything)).thenReturn({
        rows: [{
          "id": 2,
          "input_query": "test query input",
          "output_query": "test query output",
          "create_date": "2020-12-27T08:00:00.000Z",
          "user_id": 74
        }]
      });
      try {
        const results = await convertedQuerySrc.getConvertedQuery('2', {
          id: 'test'
        });
        expect(results).deep.equal([{
          "id": 2,
          "input_query": "test query input",
          "output_query": "test query output",
          "create_date": "2020-12-27T08:00:00.000Z",
          "user_id": 74
        }]);
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
  });

  describe('deleteConvertedQuery', () => {
    it('should return error on db error', async () => {
      td.when(db.query(anything, anything)).thenReject('fake error');
      try {
        const results = await convertedQuerySrc.deleteConvertedQuery(1, { id: 'test' });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not delete converted query');
      }
    });
    it('should delete converted query', async () => {
      td.when(db.query(anything, anything)).thenReturn({ "command": "DELETE", "rowCount": 1, "oid": null, "rows": [], "fields": [], "_types": { "_types": { "arrayParser": {}, "builtins": { "BOOL": 16, "BYTEA": 17, "CHAR": 18, "INT8": 20, "INT2": 21, "INT4": 23, "REGPROC": 24, "TEXT": 25, "OID": 26, "TID": 27, "XID": 28, "CID": 29, "JSON": 114, "XML": 142, "PG_NODE_TREE": 194, "SMGR": 210, "PATH": 602, "POLYGON": 604, "CIDR": 650, "FLOAT4": 700, "FLOAT8": 701, "ABSTIME": 702, "RELTIME": 703, "TINTERVAL": 704, "CIRCLE": 718, "MACADDR8": 774, "MONEY": 790, "MACADDR": 829, "INET": 869, "ACLITEM": 1033, "BPCHAR": 1042, "VARCHAR": 1043, "DATE": 1082, "TIME": 1083, "TIMESTAMP": 1114, "TIMESTAMPTZ": 1184, "INTERVAL": 1186, "TIMETZ": 1266, "BIT": 1560, "VARBIT": 1562, "NUMERIC": 1700, "REFCURSOR": 1790, "REGPROCEDURE": 2202, "REGOPER": 2203, "REGOPERATOR": 2204, "REGCLASS": 2205, "REGTYPE": 2206, "UUID": 2950, "TXID_SNAPSHOT": 2970, "PG_LSN": 3220, "PG_NDISTINCT": 3361, "PG_DEPENDENCIES": 3402, "TSVECTOR": 3614, "TSQUERY": 3615, "GTSVECTOR": 3642, "REGCONFIG": 3734, "REGDICTIONARY": 3769, "JSONB": 3802, "REGNAMESPACE": 4089, "REGROLE": 4096 } }, "text": {}, "binary": {} }, "RowCtor": null, "rowAsArray": false });
      try {
        const results = await convertedQuerySrc.deleteConvertedQuery('2', {
          id: 'test'
        });
        expect(JSON.stringify(results)).to.contain('Deleted succesfully');
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
  });

});
