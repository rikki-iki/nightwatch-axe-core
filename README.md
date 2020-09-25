# Nightwatch aXe-core

Nightwatch.js commands for running aXe-core.

## Installation

Install using yarn or npm

```bash
npm install nightwatch-axe-core --save-dev
```

Add these commands to the `custom_commands_path` in your Nightwatch.js configuration.

```js
{
  custom_commands_path : [
    "./node_modules/nightwatch-axe-core/commands"
  ]
}
```

## Configuration & Usage

The `axe()` command takes the following two parameters:

Parameter Name | Parameter Type   | Description
-------------  | ---------------- | -----------
context        | string or object | css selector or [include/exclude object](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#context-parameter)
options        | object           | set of [axe options](https://github.com/dequelabs/axe-core/blob/master/doc/API.md#options-parameter)

These can be defined globally and/or per call to the `axe()` command.

__In addition to the standard aXe `options`:__

- `options.verbose` set to `true` will log all successful `aXe` tests.
- `options.timeout` configures Nightwatch's `timeoutsAsyncScript()` amount, default value is `1000 milliseconds`.

aXe can require a fair amount of time to run, so increasing the `timeout` option is often required.

__Injecting aXe-core__

The `axe()` command will inject `./node_modules/axe-core/axe-core.min.js` into your test fixture, just once, by running 
the `includeAxe()` command and checking for it at the start of the `axe()` command.

If it fails to inject or find the script it will throw an error. If it fails please check the `axe-core` package has 
been installed.

### Global configuration file

Create an `axe.conf.js` file in your project root as an CommonJS module that exports a default object with both the 
`context` and `options` parameters:

```js
// axe.conf.js

module.exports = {
  context: {
    include: [['html']],
    exclude: [['.advertising']],
  },
  options: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa'],
    },
    verbose: true,
    timeout: 2000,
  }
};
```

Then your test simply needs to call the `axe()` command.

```js
// nightwatch-test.js

export default {
  '@tags': ['accessibility'],

  'Thing passes aXe-core checks': function (browser) {
    browser
      .url(`${browser.launch_url}/page-to-test`)
      .waitForElementPresent('.thing-to-test')
      .axe()
      .end()
  }
}
```

### Per test configuration

When calling `axe()` you can can pass in the `context` and `options` values as arguments to override any global 
configuration. 

```js
axe(context, options)
```

For example;
```js
// nightwatch-test.js

export default {
  '@tags': ['accessibility'],

  'Thing passes aXe-core checks': function (browser) {
    browser
      .url(`${browser.launch_url}/page-to-test`)
      .waitForElementPresent('.thing-to-test')
      .axe('.thing-to-test', {
        runOnly: {
          type: 'tag',
          values: ['wcag2a']
        },
        rules: {
          'color-contrast': { enabled: true },
          'valid-lang': { enabled: false }
        },
        verbose: false,
        timeout: 5000,
      })
      .end()
  }
}
```
