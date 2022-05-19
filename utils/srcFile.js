const { logger } = require('./logger');
const { isHttpCode } = require('./httpTools');

/**
 * @function srcFileErrorHandler
 * @description Check if the error has an http code, a message, then handle throwing error with code
 * @param {*} error - Error to handle
 * @param {string} responseMessage - Error message to return on response
 * @param {number} responseCode - Http code to send on response
 * @throws errorWithCode
 */
const srcFileErrorHandler = function srcFileErrorHandler(error, responseMessage, responseCode = 500) {
  if (error.code && isHttpCode(error.code)) {
    logger.error(error);
    throw error;
  }
  logger.error({ responseMessage, error });
  throw { code: responseCode, message: responseMessage };
};

/**
 * @function checkRequiredParameters
 * @description Ensure all parameters have values
 * @param {object} parametersObject - A list of variables and their values to check
 * @return {boolean} results
 * @throws {object} errorCodeAndMsg
 */
const checkRequiredParameters = function checkRequiredParameters(parametersObject) {
  const missingItems = Object.keys(parametersObject).filter((k) => {
    const item = parametersObject[k];
    if (!(item || item === 0) || item.length < 0) return k;
    else return false;
  });
  if (missingItems.length > 0) throw { message: `Missing a required variable(s): ${missingItems}`, code: 400 };
  else return true;
};

module.exports = {
  srcFileErrorHandler,
  checkRequiredParameters
};
