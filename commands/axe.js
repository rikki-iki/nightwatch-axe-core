/* eslint-disable func-names, max-nested-callbacks, no-console */
/**
 * @file Custom axe-core runner.
 */

const path = require('path');
const fs = require('fs');
const CONFIG_FILENAME = 'axe.conf.js';

/**
 * Check and run Axe.
 * See https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#api-name-axerun
 *
 * @param {string} cxt - The html selector to run on.
 * @param {object} opt - Axe options.
 * @param {function} done - Done callback.
 */
const runAxe = (cxt, opt, done) => {
  if (!window.axe) {
    done({ error: 'window.axe not found. Try increasing the "options.timeout" in your axe.conf file.' });
  }

  window.axe
    .run(cxt, opt)
    .then((results) => {
      done({ results });
    })
    .catch((error) => {
      done({ error: error.toString() });
    });
};

/**
 * Nightwatch command to load and run Axe.
 *
 * @param {string} customContext - The html selector to runAxe() on. Defaults to axe.conf context.
 * @param {object} customOptions - Axe options. Defaults to axe.conf options.
 * @return {command} - Return this to make sure commands can be chained.
 */
module.exports.command = function (customContext, customOptions) {
  let defaultConfig = {
    options: {
      timeout: 1000,
    },
    context: 'html',
  };
  if (fs.existsSync(path.resolve(CONFIG_FILENAME))) {
    defaultConfig = require(path.resolve(CONFIG_FILENAME));
  }

  const { context, options } = defaultConfig;
  const ctx = customContext || context;
  const opt = customOptions || options;

  this.perform(() => {
    // Set Nightwatch async script timeout option,
    // because axe-core can need more time.
    this.timeoutsAsyncScript(opt.timeout || 1000);

    // Make sure axe-core script is included.
    // See /tests/nightwatch/commands/includeAxe.js
    this.includeAxe((axe) => {
      if (!axe) {
        throw new Error('The includeAxe() command failed to append the axe-core script to the fixture. Please make sure the axe-core node module is installed.');
      }

      // Execute runeAxe() asynchronously.
      this.executeAsync(runAxe, [ctx, opt], (response) => {
        const { results } = response.value;
        if (response.errorStatus === 28) {
          throw new Error('Try increasing the "options.timeout" in your axe.conf.js file.');
        }
        else if (response.error) {
          throw new Error(response.error);
        }

        const { passes, violations } = results;
        const passCount = passes.length;
        const failCount = violations.length;

        if (opt.verbose) {
          // If verbose list each pass as well.
          passes.forEach((pass) => {
            this.assert.ok(true, pass.help);
          });
        }

        if (passCount > 0 && failCount === 0) {
          // Show passed count.
          this.assert.ok(true, `Axe: ${passCount} passed.`);
        }

        violations.forEach((violation, i) => {
          i += 1;
          // If violations, list each one with as much information as possible.
          const {
            id, help, helpUrl, impact, nodes,
          } = violation;
          const url = helpUrl.split('?')[0];

          // Console log for better formatting.
          console.log(`-----aXe-----\n#${i} - ${help} (${id})\nImpact: ${impact}\nCount: ${nodes.length}\nSee: ${url}`);
          nodes.forEach((node, ii) => {
            ii += 1;
            const { failureSummary, html } = node;
            console.log(`#${i}.${ii} - ${failureSummary}\n  ${html}`);
          });
          console.log('-------------');
        });

        if (failCount > 0) {
          // Show violation count and fail.
          this.assert.fail(`Axe: ${failCount} rule violation(s). See console output for details`);
        }
      });
    });
  });

  return this;
};
