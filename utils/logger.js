const { createLogger, format, transports } = require('winston');

// Set default log level for file and console transports
const logFileLevel = process.env.RUBUS_BACKEND_LOG_FILE_LEVEL || 'error';
const logConsoleLevel = process.env.RUBUS_BACKEND_LOG_CONSOLE_LEVEL || 'debug';

// Set log file path
const logFilePath = process.env.RUBUS_BACKEND_LOG_FILE_PATH || './rubus-backend.log';

// Create a format without color for file transport
const fileFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    const { timestamp, level, message } = info;
    return `${timestamp.slice(0, 19).replace('T', ' ')} ${level}: ${JSON.stringify(message)}`;
  }),
  format.printf((debug) => {
    const { timestamp, level, message } = debug;
    return `${timestamp.slice(0, 19).replace('T', ' ')} ${level}: ${JSON.stringify(message)}`;
  }),
  format.printf((error) => {
    const { timestamp, level, message } = error;
    return `${timestamp.slice(0, 19).replace('T', ' ')} ${level}: ${JSON.stringify(message)}`;
  }),
);

// Create a format with color for console transport
const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.printf((info) => {
    const { timestamp, level, message } = info;
    return `${timestamp.slice(0, 19).replace('T', ' ')} [${level}]: ${JSON.stringify(message)}`;
  }),
  format.printf((debug) => {
    const { timestamp, level, message } = debug;
    return `${timestamp.slice(0, 19).replace('T', ' ')} [${level}]: ${JSON.stringify(message)}`;
  }),
  format.printf((error) => {
    const { timestamp, level, message } = error;
    return `${timestamp.slice(0, 19).replace('T', ' ')} [${level}]: ${JSON.stringify(message)}`;
  }),
);

// Create a logger with file transport
const logger = createLogger({
  format: fileFormat,
  level: logFileLevel,
  transports: [
    new transports.File({ filename: logFilePath, handleExceptions: true, handleRejections: true })
  ],
  silent: process.argv.indexOf('--silent') >= 0,
  exitOnError: false
});

// If the environment not production, add console transport
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    level: logConsoleLevel,
    format: consoleFormat
  }));
}

module.exports = {
  logger
};
