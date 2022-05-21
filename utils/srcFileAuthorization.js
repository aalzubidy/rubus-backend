const { logger } = require('./logger');

/**
 * @function callSrcFile
 * @description Custom function to call src file after verifying user token
 * @param {string} srcFunctionName - source file function name
 * @param {array} parameters - Variables to send with the function
 * @returns {object} response
 */
const callSrcFile = async function callSrc(srcFile, functionName, parameters, req, res) {
  try {
    const user = {
      id: req.session?.getUserId() || ''
    };

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
  callSrcFile
};
