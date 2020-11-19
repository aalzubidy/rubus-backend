const moment = require('moment');
const db = require('../db/db');

/**
 * Create new project
 * @param {*} req http request contains project tile and description
 * @returns {object} newProjectResults
 * @throws {object} errorCodeAndMsg
 */
const newProject = async function newProject(req, user) {
  try {
    const {
      title,
      description
    } = req.body;

    // Check if there is no email or password
    if (!title) {
      throw { code: 400, message: 'Please provide project title' };
    }

    // Generate create date
    const createDate = moment().format('MM/DD/YYYY');

    // Create a user in the database
    await db.query('INSERT INTO projects(title, description, user_id, create_date) VALUES($1, $2, $3, $4)', [title, description, user.id, createDate]);

    return { message: 'Project created successfully' };
  } catch (error) {
    if (error.code) {
      throw error;
    }
    const userMsg = 'Could not create project';
    console.log(userMsg, error);
    throw { code: 500, message: userMsg };
  }
};

module.exports = {
  newProject
};
