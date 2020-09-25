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

- `options.verbose` set to `true` will log all successful `aXe` tests in additional to the unsuccessful ones.
- `options.relatedNodes` set to `true` will log other html that relates to the rule violation. This can be helpful to enable 
when debugging.
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

When calling `axe()` you can can pass in the `context` and `options` values as arguments. `context` will __override__
any globally defined contexts, whilst `options` will be __merged with__ any globally defined options. This way you can
have edge case tests that inherit global config but can easily be change one or two things.

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
      })
      .end()
  }
}
```

### Debugging

When debugging a failure it can be useful to enable all of the output options, and set a large timeout;

```js
options: {
  timeout: 60000,
  verbose: true,
  selectors: true,
  absolutePaths: true,
  ancestry: true,
  elementRef: true,
  relatedNodes: true,
}
```

This will give you as much information as possible into what caused the failure.

Another helpful option is setting `resultTypes: ['violations']`, as described in the 
[axe-core docs](https://github.com/dequelabs/axe-core/blob/83056ada0e50dc943a5e2829c97323a744cb3b28/doc/API.md#section-4-performance)
which can improve performance and reduce timeout failures.
