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
const projectSrc = require('../../../src/projectSrc');
const db = require('../../../utils/db');
const tools = require('../../../src/tools');

describe('projectSrc.js', function () {
  beforeEach(function () {
    td.replace(db, 'query');
    td.replace(tools, 'checkUserInProject');
  });

  afterEach(function () {
    td.reset();
  });

  describe('newProject', () => {
    it("Returns error if there is no project title", async () => {
      try {
        const results = await projectSrc.newProject('', '', { id: 'test' });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).contain('Please provide project title');
      }
    });
    it('should return error on database error', async () => {
      td.when(db.query(anything, anything, anything)).thenReject('fake error');
      try {
        const results = await projectSrc.newProject('test', 'test test', {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not create project');
      }
    });
    it('should return new project id', async () => {
      td.when(db.query(anything, anything, anything)).thenResolve([{ id: 1 }]);
      try {
        const results = await projectSrc.newProject('test', 'test test', {
          id: 'test'
        });
        expect(results).to.be.not.null;
        expect(results).deep.equal({
          message: 'Project created successfully',
          id: 1
        });
      } catch (error) {
        expect(error).to.be.null;
      }
    });
  });

  describe('getProjects', () => {
    it('should return error on database error', async () => {
      td.when(db.query(anything, anything, anything)).thenReject('fake error');
      try {
        const results = await projectSrc.getProjects({
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not get projects');
      }
    });
    it('should return error if there are no projects for the user', async () => {
      td.when(db.query(anything, anything, anything)).thenResolve([]);
      try {
        const results = await projectSrc.getProjects({
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('User does not have any projects');
      }
    });
    it('should return projects with admin true', async () => {
      td.when(db.query(anything, anything, anything)).thenResolve([{ "project_id": 10, "added_by": 74, "create_date": "2020-12-27T08:00:00.000Z", "title": "test", "description": "test test" }]);
      try {
        const results = await projectSrc.getProjects({
          id: 74
        });
        expect(results).to.be.not.null;
        expect(results).deep.equal([{
          "projectId": 10,
          "projectTitle": "test",
          "projectDescription": "test test",
          "joinedDate": "2020-12-27T08:00:00.000Z",
          "admin": true
        }]);
      } catch (error) {
        expect(error).to.be.null;
      }
    });
    it('should return projects with admin false', async () => {
      td.when(db.query(anything, anything, anything)).thenResolve([{ "project_id": 10, "added_by": 74, "create_date": "2020-12-27T08:00:00.000Z", "title": "test", "description": "test test" }]);
      try {
        const results = await projectSrc.getProjects({
          id: 'test'
        });
        expect(results).to.be.not.null;
        expect(results).deep.equal([{
          "projectId": 10,
          "projectTitle": "test",
          "projectDescription": "test test",
          "joinedDate": "2020-12-27T08:00:00.000Z",
          "admin": false
        }]);
      } catch (error) {
        expect(error).to.be.null;
      }
    });
  });

  describe('getProject', () => {
    it('should return error if there is no project id', async () => {
      try {
        const results = await projectSrc.getProject('', {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide project id');
      }
    });
    it('should return error if user is not in the project', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenReject({ code: 403, message: 'User is not the selected project' });
      try {
        const results = await projectSrc.getProject(10, {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(error.message).to.equal('User is not the selected project');
      }
    });
    it('should return error if project is not found', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenResolve({ allowed: true });
      td.when(db.query('select title, description, user_id, create_date from projects where id=$1', anything, anything)).thenResolve([]);
      try {
        const results = await projectSrc.getProject(10, {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(error.message).to.equal('Project is not found');
      }
    });
    it('should return error on database error', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenResolve({ allowed: true });
      td.when(db.query(anything, anything, anything)).thenReject('fake error');
      try {
        const results = await projectSrc.getProject(10, {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not get project');
      }
    });
    it('should return project with admin true', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenResolve({ allowed: true });
      td.when(db.query('select title, description, user_id, create_date from projects where id=$1', anything, anything)).thenResolve([{ "title": "test", "description": "test test", "user_id": 74, "create_date": "2020-12-27T08:00:00.000Z" }]);
      td.when(db.query('select id, name, email from projects_users, users where users.id=projects_users.user_id AND project_id=$1', anything, anything)).thenResolve([{ "id": 74, "name": "test user", "email": "a@a.com" }]);
      try {
        const results = await projectSrc.getProject(10, {
          id: 74
        });
        expect(results).to.be.not.null;
        expect(results).deep.equal({
          "projectId": 10,
          "projectTitle": "test",
          "projectDescription": "test test",
          "createdDate": "2020-12-27T08:00:00.000Z",
          "admin": true,
          "users": [{
            "id": 74,
            "name": "test user",
            "email": "a@a.com"
          }]
        });
      } catch (error) {
        expect(error).to.be.null;
      }
    });
    it('should return project with admin false', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenResolve({ allowed: true });
      td.when(db.query('select title, description, user_id, create_date from projects where id=$1', anything, anything)).thenResolve([{ "title": "test", "description": "test test", "user_id": 74, "create_date": "2020-12-27T08:00:00.000Z" }]);
      td.when(db.query('select id, name, email from projects_users, users where users.id=projects_users.user_id AND project_id=$1', anything, anything)).thenResolve([{ "id": 74, "name": "test user", "email": "a@a.com" }]);
      try {
        const results = await projectSrc.getProject(10, {
          id: 'test'
        });
        expect(results).to.be.not.null;
        expect(results).deep.equal({
          "projectId": 10,
          "projectTitle": "test",
          "projectDescription": "test test",
          "createdDate": "2020-12-27T08:00:00.000Z",
          "admin": false,
          "users": [{
            "id": 74,
            "name": "test user",
            "email": "a@a.com"
          }]
        });
      } catch (error) {
        expect(error).to.be.null;
      }
    });
  });

  describe('getProjectAdminId', () => {
    it('should return error if there is no project id', async () => {
      try {
        const results = await projectSrc.getProjectAdminId('', {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide project id');
      }
    });
    it('should return error if user is not in the project', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenReject({ code: 403, message: 'User is not the selected project' });
      try {
        const results = await projectSrc.getProjectAdminId(10, {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(error.message).to.equal('User is not the selected project');
      }
    });
    it('should return error if project is not found', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenResolve({ allowed: true });
      td.when(db.query(anything, anything, anything)).thenResolve([]);
      try {
        const results = await projectSrc.getProjectAdminId(10, {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(error.message).to.equal('Project is not found');
      }
    });
    it('should return error on database error', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenResolve({ allowed: true });
      td.when(db.query(anything, anything, anything)).thenReject('fake error');
      try {
        const results = await projectSrc.getProjectAdminId(10, {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Could not get project');
      }
    });
    it('should return project admin id', async () => {
      td.when(tools.checkUserInProject(anything, anything)).thenResolve({ allowed: true });
      td.when(db.query(anything, anything, anything)).thenResolve([{ "user_id": 1 }]);
      try {
        const results = await projectSrc.getProjectAdminId(10, {
          id: 74
        });
        expect(results).to.be.not.null;
        expect(results).deep.equal({
          "adminId": 1
        });
      } catch (error) {
        expect(error).to.be.null;
      }
    });
  });

  describe('deleteProject', () => {
    it('should return error if there is no project id', async () => {
      try {
        const results = await projectSrc.deleteProject('', {
          id: 'test'
        });
        expect(results).to.be.null;
      } catch (error) {
        expect(error).to.be.not.null;
        expect(JSON.stringify(error)).to.contain('Please provide project id');
      }
    });
  });

});
