const nodemailer = require('nodemailer');
const { logger } = require('./logger');
const { isHttpCode } = require('./httpTools');

/**
 * @function sendEmailText
 * @summary Send a text email
 * @params {string} emailTo
 * @params {string} subject
 * @params {string} textBody
 * @returns {object} sendEmailResults
 * @throws {object} sendEmailErroCodeResults
 */
const sendEmailText = async function sendEmailText(emailTo, subject, body) {
  // Set default log level for file and console transports
  const emailUsername = process.env.RUBUS_EMAIL_USERNAME || 'error';
  const emailPassword = process.env.RUBUS_EMAIL_PASSWORD || 'debug';

  try {
    const emailAccount = {
      'user': emailUsername,
      'pass': emailPassword
    };

    const transporter = nodemailer.createTransport({
      name: 'aalzubidy.com',
      host: 'server204.web-hosting.com',
      port: 465,
      secure: true,
      auth: {
        user: emailAccount.user,
        pass: emailAccount.pass,
      },
      logger: false
    });

    const info = await transporter.sendMail({
      from: '"Rubus" <' + emailAccount.user + '>',
      to: emailTo,
      subject,
      text: body
    });

    logger.debug({ label: 'Email sent', emailFrom: emailAccount.user, emailTo: emailTo, messageId: info.messageId });

    return { message: 'Email sent', emailFrom: emailAccount.user, emailTo: emailTo, messageId: info.messageId };
  } catch (error) {
    logger.error(error);
    if (error.code && isHttpCode(error.code)) throw error;
    throw { code: 500, message: 'Could not send email' };
  }
};

module.exports = {
  sendEmailText
};
