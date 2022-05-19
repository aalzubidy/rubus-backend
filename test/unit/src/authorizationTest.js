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
const authorizationSrc = require('../../../src/authorizationSrc');
const db = require('../../../db/db');

describe('authorizationSrc.js', function () {
  beforeEach(function () {
    td.replace(db, 'query');
  });

  afterEach(function () {
    td.reset();
  });

  describe('register', () => {
    it('should return new user id', async () => {
      td.when(db.query(anything, anything)).thenReturn({
        rows: [{
          id: 1
        }]
      });
      try {
        const input = {
          "name": "test user",
          "email": "test@test.com",
          "password": "test",
          "organization": "org name"
        };
        const results = await authorizationSrc.register({
          body: input
        });
        expect(results).deep.equal({
          "message": "User registered successfully",
          "id": 1
        });
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
    it('should return error on missing email and password on registration', async () => {
      try {
        const results = await authorizationSrc.register({
          body: {}
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide email and password');
      }
    });
    it("Returns error when bcrypt fails", async () => {
      const stub1 = sinon.stub(bcrypt, 'hash');
      stub1.onCall(0).throws('fake error !');
      const req = {
        body: {
          email: 'abc@something.com',
          password: 'abc123',
          organization: 'some place',
          name: 'AAAA'
        }
      }
      try {
        const results = await authorizationSrc.register(req);
        expect(results).to.be.null;
      } catch (error) {
        console.log(error);
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).contain('Could not register user');
        stub1.restore();
      }
    });
    it('should return error on database error', async () => {
      td.when(db.query(anything, anything)).thenReject('fake error');
      try {
        const input = {
          "name": "test user",
          "email": "test@test.com",
          "password": "test",
          "organization": "org name"
        };
        const results = await authorizationSrc.register({
          body: input
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not register user');
      }
    });
  });

  describe('login', () => {
    it('should return error on missing email and password on login', async () => {
      try {
        const results = await authorizationSrc.login({
          body: {}
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide email and password');
      }
    });
    it('should return unauthorized if username not in database', async () => {
      td.when(db.query(anything, anything)).thenReturn({
        rows: []
      });
      try {
        const input = {
          "email": "test@test.com",
          "password": "test"
        };
        const results = await authorizationSrc.login({
          body: input
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please check email and password');
      }
    });
    it('should return unauthorized if password does not match', async () => {
      td.when(db.query(anything, anything)).thenReturn({
        rows: [{
          id: 'test',
          email: 'test',
          name: 'test',
          password: 'organization',
          password: 'test'
        }]
      });
      try {
        const input = {
          "email": "test@test.com",
          "password": "test1"
        };
        const results = await authorizationSrc.login({
          body: input
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please check email and password');
      }
    });
    it.skip('should return access token and refresh token on successful login', async () => {
      td.when(db.query(anything, anything)).thenReturn({
        rows: [{
          id: 1,
          email: 'test@test.com',
          name: 'test',
          organization: 'test',
          password: '$2b$12$r6vMkpEn/6nY.UvxrNLA.Ouu0jnCAm4PDNUBiDqUMeBstK/pyDsNm'
        }]
      });
      try {
        const input = {
          "email": "test@test.com",
          "password": "passwd"
        };
        const results = await authorizationSrc.login({
          body: input
        });
        expect(results.accessToken).length.above(0);
        expect(results.refreshToken).length.above(0);
        td.reset();
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
  });

  describe.skip('logout', () => {
    it('should return error on missing token or refres token on logout', async () => {
      try {
        const results = await authorizationSrc.logout({
          headers: {},
          body: {}
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide token and refresh token');
      }
    });
    it('should return error on jwt verify', async () => {
      try {
        const results = await authorizationSrc.logout({
          headers: {
            token: 'test'
          },
          body: {
            refreshToken: 'test'
          }
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not logout');
      }
    });
    it('should return error on jwt id verify', async () => {
      let stub1 = sinon.stub(jwt, 'verify');
      stub1.onCall(0).returns({
        id: 'test'
      });
      stub1.onCall(1).returns({
        id: 'test1'
      });
      try {
        const results = await authorizationSrc.logout({
          headers: {
            token: 'test'
          },
          body: {
            refreshToken: 'test'
          }
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide valid token and refresh token');
        stub1.restore();
      }
    });
    it('should return error on deleting refresh token', async () => {
      let stub1 = sinon.stub(jwt, 'verify');
      stub1.onCall(0).returns({
        id: 'test'
      });
      stub1.onCall(1).returns({
        id: 'test'
      });
      td.when(db.query(anything, anything)).thenReject('fake error');
      try {
        const results = await authorizationSrc.logout({
          headers: {
            token: 'test'
          },
          body: {
            refreshToken: 'test'
          }
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not logout');
        stub1.restore();
      }
    });
    it('should logout successful', async () => {
      let stub1 = sinon.stub(jwt, 'verify');
      stub1.onCall(0).returns({
        id: 'test'
      });
      stub1.onCall(1).returns({
        id: 'test'
      });
      td.when(db.query(anything, anything)).thenReturn(true);
      try {
        const results = await authorizationSrc.logout({
          headers: {
            token: 'test'
          },
          body: {
            refreshToken: 'test'
          }
        });
        expect(JSON.stringify(results)).to.contain('Logged out successful');
        stub1.restore();
      } catch (error) {
        expect(error).to.be.null;
      }
    });
  });

  describe('renewToken', () => {
    it('should return error on missing token or refres token on renew token', async () => {
      try {
        const results = await authorizationSrc.renewToken({
          headers: {},
          body: {}
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide token and refresh token');
      }
    });
    it('should return error on jwt id verify', async () => {
      let stub1 = sinon.stub(jwt, 'verify');
      stub1.onCall(0).returns({
        email: 'test'
      });
      stub1.onCall(1).returns({
        email: 'test1'
      });
      try {
        const results = await authorizationSrc.renewToken({
          headers: {
            token: 'test'
          },
          body: {
            refreshToken: 'test'
          }
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not verify tokens');
        stub1.restore();
      }
    });
    it('should return error on jwt verify', async () => {
      let stub1 = sinon.stub(jwt, 'verify');
      stub1.onCall(0).throws({
        email: 'test'
      });
      try {
        const results = await authorizationSrc.renewToken({
          headers: {
            token: 'test'
          },
          body: {
            refreshToken: 'test'
          }
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not generate a new token from existing refresh token');
        stub1.restore();
      }
    });
    it('should renew token', async () => {
      const stub1 = sinon.stub(jwt, 'verify');
      stub1.onCall(0).returns({
        id: 'test',
        name: 'test',
        email: 'test',
        organization: 'test'
      });
      stub1.onCall(1).returns({
        id: 'test',
        name: 'test',
        email: 'test',
        organization: 'test'
      });
      td.when(db.query(anything, anything)).thenReturn({
        rows: [{
          email: 'test'
        }]
      });

      const stub2 = sinon.stub(jwt, 'sign');
      stub2.onCall(0).returns('new test token');
      stub2.onCall(1).returns('new test token');
      try {
        const results = await authorizationSrc.renewToken({
          headers: {
            token: 'test'
          },
          body: {
            refreshToken: 'test'
          }
        });
        expect(results.accessToken).length.to.be.above(0);
        expect(results.refreshToken).length.to.be.above(0);
        stub1.restore();
        stub2.restore();
      } catch (error) {
        expect(error).to.be.null;
      }
    });
  });

  describe('verifyToken', () => {
    it('should return error on missing token', async () => {
      try {
        const results = await authorizationSrc.verifyToken({
          headers: {}
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Token required');
      }
    });
    it('should return error on verify token', async () => {
      try {
        const results = await authorizationSrc.verifyToken({
          headers: {
            token: 'test'
          }
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not verify token');
      }
    });
    it('should verify token', async () => {
      let stub = sinon.stub(jwt, "verify").returns({
        id: 'test'
      });
      try {
        const results = await authorizationSrc.verifyToken({
          headers: {
            token: 'test'
          }
        });
        expect(results).to.deep.equal({
          id: 'test'
        });
        stub.restore();
      } catch (error) {
        console.log(error);
        expect(error).to.be.null;
      }
    });
  });

});
