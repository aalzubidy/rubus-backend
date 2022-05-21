const { logger } = require('./logger');

const routesLogger = function routesLogger(req) {
  try {
    logger.debug({ method: req.method.trim(), url: req.url.trim(), body: req.body });
    return req.next();
  } catch (error) {
    return req.next();
  }
};

module.exports = {
  routesLogger
};
