# hub.js [![Build Status](https://secure.travis-ci.org/mantoni/hub.js.png?branch=master)](http://travis-ci.org/mantoni/hub.js)

Pub/Sub oriented JavaScript

Repository: https://github.com/mantoni/hub.js

## Install with NPM

```
npm install hubjs
```

## Download for browsers

Browser packages are here: http://maxantoni.de/hub.js/


## Usage

See the [hub.js wiki](https://github.com/mantoni/hub.js/wiki) for examples and documentation.

## Contributing

Here is what you need for development:
 - `npm install` will install all the dev dependencies
 - `make` does all of the following
 - `make lint` lint the code with JSLint
 - `make test` runs all unit tests in Node
 - `make browser` generates a static web page at `test/all.html` to run the tests in a browser
 - `make phantom` runs all tests in a [headless WebKit](http://phantomjs.org/). Make sure `phantomjs` is in your path.

To build a standalone browserified package containing the merged / minified scripts run `make package`.
