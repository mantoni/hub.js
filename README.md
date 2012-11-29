# hub.js

Pub/Sub oriented JavaScript

[![Build Status](https://secure.travis-ci.org/mantoni/hub.js.png?branch=master)](http://travis-ci.org/mantoni/hub.js)

## Install on Node

```
npm install hubjs
```

## Download for browsers

Browser packages are here: https://github.com/mantoni/hub.js/downloads.


## Usage

See the [hub.js homepage](http://mantoni.github.com/hub.js) for documentation.

## Hacking

If you'd like to hack hub.js here is how to get started:

 - `npm install` will setup everything you need.
 - `make` lints the code with JSLint and runs all unit tests.
 - You can also `make lint` or `make test` individually.

Running the test cases in a browser instead of Node requires [nomo.js](https://github.com/mantoni/nomo.js).

 - Run `npm install -g nomo`
 - Run `nomo server` from within the project directory.
 - Open http://localhost:4444/test in your browser.

To build a browser package containing the merged / minified scripts run `make package`.
