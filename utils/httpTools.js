const { StatusCodes } = require('http-status-codes');
const multer = require('multer');
const path = require('path');
const { logger } = require('./logger');

/**
 * @function isHttpCode
 * @summary Check if a code is an http code
 * @params {*} errorCode - Code to check
 * @returns {boolean} httpErroCodeResults
 */
const isHttpCode = function isHttpCode(errorCode) {
  try {
    return Object.keys(StatusCodes).some((sCode) => sCode == errorCode);
  } catch (error) {
    return false;
  }
};

// Multer configruations to parse request and upload file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // no larger than 5mb
  },
  fileFilter: function (req, file, callback) {
    try {
      const ext = path.extname(file.originalname);
      if (ext !== '.png') throw { code: 400, message: 'Unsupported file type, only zip files are allowed' };
      logger.debug({ label: 'Filtered file - format okay' });
      callback(null, true);
    } catch (error) {
      if (error.code && isHttpCode(error.code)) {
        logger.error(error);
        callback(error);
      }
      const userMsg = 'Could not filter file';
      logger.error({ userMsg, error });
      callback({ code: 500, message: userMsg });
    }
  }
}).single('file');

/**
 * @function parseFormDataWithFile
 * @summary Parse form data from http request
 * @param {object} req Http request
 * @returns {object} reqParsed
 * @throws {object} errorDetails
 */
const parseFormDataWithFile = function parseFormDataWithFile(req) {
  return new Promise((resolve, reject) => {
    upload(req, {}, (err) => {
      if (err) reject(err);
      resolve(req);
    });
  });
};

module.exports = {
  isHttpCode,
  parseFormDataWithFile
};
