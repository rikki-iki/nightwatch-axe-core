/* eslint-disable func-names */
/**
 * @file
 * Load axe-core into the fixture.
 */

const fs = require('fs');
const path = require('path');

/**
 * Nightwatch command to load axe-core script into text fixtures.
 *
 * @param {function} callback - Allow other commands to see the return value.
 * @return {command} - Return this to make sure commands can be chained.
 */
module.exports.command = function (callback) {
  const self = this;
  const filePath = path.resolve(path.join(path.dirname(require.resolve('axe-core')), 'axe.min.js'));
  let fileText;
  let included = false;

  try {
    fileText = fs.readFileSync(filePath, 'utf8');
  }
  catch (err) {
    throw new Error(`Unable to open file: ${filePath}`);
  }

  this.execute(function (src) {
    // ensure to inject only once!
    const axeCore = document.querySelector('#axe-core');
    if (src && !axeCore) {
      const script = document.createElement('script');
      script.id = 'axe-core';
      script.text = src;
      document.head.appendChild(script);
      included = true;
    }
    // But flag as included if it's run again.
    if (axeCore) {
      included = true;
    }
    return included;
  }, [fileText], (result) => {
    if (typeof callback === 'function') {
      callback.call(self, result.value);
    }
  });

  return this;
};
