/* eslint-disable func-names, max-nested-callbacks, no-console */
/**
 * @file Custom axe-core runner.
 */

const chalk = require('chalk');
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
const runAxe = function (cxt, opt, done) {
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
module.exports.command = function (customContext, customOptions = {}) {
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
  const opt = Object.assign(options, customOptions);

  this.perform(() => {
    // Set Nightwatch async script timeout option,
    // because axe-core can need more time.
    this.timeoutsAsyncScript(opt.timeout);

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
        else if (response.value.error) {
          throw new Error(response.value.error);
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

        if (failCount > 0) {
          console.log(chalk.red(`-----${failCount} aXe violations-----`));
        }

        violations.forEach((violation, i) => {
          i += 1;
          // If violations, list each one with as much information as possible.
          const {
            id, help, helpUrl, impact, nodes,
          } = violation;
          const url = helpUrl.split('?')[0];

          // Console log for better formatting.
          console.log(chalk.red.bold(`#${i}: ${help}`) + chalk.red(` (${id})`));
          console.log(`Impact: ${chalk.cyan(impact)}`);
          console.log(`Count: ${chalk.cyan(nodes.length)}`);
          console.log(`See: ${chalk.cyan(url)}`);

          // Each violation can effect multiple nodes.
          nodes.forEach((node, ii) => {
            ii += 1;
            const { failureSummary, html } = node;
            console.log(chalk.red.bold(`#${i}.${ii}`) + `: ${failureSummary}`);
            console.log(chalk.green(`  ${html}`));
            if (opt.selectors) {
              console.log(`  Selector: ${chalk.cyan(node.target)}`);
            }
            if (opt.ancestry) {
              console.log(`  Ancestry: ${chalk.cyan(node.ancestry)}`);
            }
            if (opt.elementRef) {
              console.log(`  Element reference: ${chalk.yellow(node.element.ELEMENT)}`);
            }
            if (opt.relatedNodes) {
              console.log('--\nRelated nodes:');
              const all = node.any.concat(node.all, node.none);
              all.forEach((eachNode) => {
                console.log(eachNode.message);
                eachNode.relatedNodes.forEach((relatedNode) => {
                  console.log(`Selector: ${chalk.cyan(relatedNode.target)}`);
                })
              })
            }
          });
          console.log('');
        });

        if (failCount > 0) {
          console.log(chalk.red('--------------------------'));
          // Show violation count and fail.
          this.assert.fail(`Axe: ${failCount} rule violation(s). See aXe violations output for details`);
        }
      });
    });
  });

  return this;
};
