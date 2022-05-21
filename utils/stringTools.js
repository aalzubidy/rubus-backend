const Filter = require('bad-words-plus');
const filter = new Filter();

/**
 * @function titleCase
 * @summary Convert a string to title case format
 * @params {string} inputString Input string
 * @returns {string} titleCaseString
 */
const titleCase = function titleCase(inputString) {
  try {
    return inputString.toLowerCase().split(' ').map(function (word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  } catch (error) {
    return inputString;
  }
};

/**
 * @function cleanBulk
 * @summary Clean profane language from items
 * @params {object} itemsToClean - Items to clean
 * @returns {object} cleanItems
 * @throws {error} errorDetails
 */
const cleanBulk = function cleanBulk(itemsToClean) {
  try {
    const cleanItems = {};

    Object.keys(itemsToClean).forEach((k) => {
      cleanItems[k] = filter.clean(itemsToClean[k]);
    });

    return cleanItems;
  } catch (error) {
    throw { code: 500, message: 'Could not clean bulk items' };
  }
};

/**
 * @function isProfaneBulk
 * @summary Check profane language for items return true if any of them is bad word
 * @params {array} itemsToCheck - Items to check
 * @returns {boolean} checkItemsResults
 * @throws {error} errorDetails
 */
const isProfaneBulk = function isProfaneBulk(itemsToCheck) {
  try {
    return itemsToCheck.some((item) => {
      console.log(item);
      console.log(filter.isProfane(item));
      return filter.isProfane(item);
    });
  } catch (error) {
    throw { code: 500, message: 'Could not check profane bulk items' };
  }
};

module.exports = {
  titleCase,
  cleanBulk,
  isProfaneBulk
};
