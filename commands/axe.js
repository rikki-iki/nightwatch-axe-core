/**
 * @file Custom axe-core runner.
 */
const path = require('path');
const fs = require('fs');

const CONFIG_FILENAME = 'axe.conf.js';

module.exports = {
  /**
   * Nightwatch command to load and run Axe.
   *
   * @param {string} customContext - The html selector to runAxe() on. Defaults to axe.conf context.
   * @param {object} customOptions - Axe options. Defaults to axe.conf options.
   */
  async command(customContext, customOptions = {}) {
    let config = {}
    let options = {timeout: 1000}
    let context = "html"
    if (fs.existsSync(path.resolve(CONFIG_FILENAME))) {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      config = require(path.resolve(CONFIG_FILENAME))
      options = {...options, ...config.options}
      context = config.context || context
    }
    options = {...options, ...customOptions}
    context = customContext || context

    // Set Nightwatch async script timeout option,
    // because axe-core can need more time.
    this.timeoutsAsyncScript(options.timeout);
    // Make sure axe-core script is included.
    this.axeInject()
    // Call axe run with our custom config.
    this.axeRun(context, options)
  },
}
