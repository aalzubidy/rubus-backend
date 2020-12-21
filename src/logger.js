const { createLogger, format, transports } = require('winston');

// Set log file path
const logFilePath = './rubus.log';

// Create a format without color for file transport
const fileFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    const { timestamp, level, message } = info;
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
);

// Create logger
const logger = createLogger({
  format: fileFormat,
  level: 'debug',
  transports: [
    new transports.File({ filename: logFilePath, handleExceptions: true, handleRejections: true }),
  ],
  exitOnError: false
});

// If the environment not production, enable console transport
if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    level: 'debug',
    format: consoleFormat
  }));
}

module.exports = {
  logger
};
