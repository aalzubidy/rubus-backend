const { logger } = require('./logger');
const authorizationSrc = require('../src/authorizationSrc');

/**
 * @function callSrcFile
 * @description Custom function to call src file after verifying user token
 * @param {string} srcFunctionName - source file function name
 * @param {array} parameters - Variables to send with the function
 * @returns {object} response
 */
const callSrcFile = async function callSrc(srcFile, functionName, parameters, req, res) {
  let userCheckPass = false;
  try {
    let user = {};
    user = await authorizationSrc.verifyToken(req);

    if (user) userCheckPass = true;
    else throw new Error('Not authorized');

    const data = await srcFile[functionName].apply(this, [...parameters, user]);
    res.status(200).json({
      data
    });
  } catch (error) {
    logger.error(error);
    if (error && error.code) {
      res.status(error.code).json({
        error
      });
    } else if (error && !userCheckPass) {
      res.status(401).json({
        error: {
          code: 401,
          message: 'Not authorized'
        }
      });
    } else {
      res.status(500).json({
        error: {
          code: 500,
          message: `Could not process ${req.originalUrl} request`
        }
      });
    }
  }
};

/**
 * @function callSrcFileSkipVerify
 * @description Custom function to call src file and skiping user token verification
 * @param {object} srcFile - Source file to call a function on
 * @param {string} srcFunctionName - source file function name
 * @param {array} parameters - Variables to send with the function
 * @param {*} req - Http request
 * @param {*} res - Http response
 * @returns {object} response
 */
const callSrcFileSkipVerify = async function callSrcFileSkipVerify(srcFile, functionName, parameters, req, res) {
  try {
    const data = await srcFile[functionName].apply(this, [...parameters]);
    res.status(200).json({
      data
    });
  } catch (error) {
    logger.error(error);
    if (error && error.code) {
      res.status(error.code).json({
        error
      });
    } else {
      res.status(500).json({
        error: {
          code: 500,
          message: `Could not process ${req.originalUrl} request`
        }
      });
    }
  }
};

module.exports = {
  callSrcFile,
  callSrcFileSkipVerify
};
