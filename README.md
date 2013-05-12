# hub.js [![Build Status](https://secure.travis-ci.org/mantoni/hub.js.png?branch=master)](http://travis-ci.org/mantoni/hub.js)

Pub/Sub oriented JavaScript

Homepage: <http://maxantoni.de/projects/hub.js/>

Repository: <https://github.com/mantoni/hub.js>

---

## Install with NPM

```
npm install hubjs
```

## Download for browsers

Standalone browser packages are here: <http://maxantoni.de/hub.js/>

You can also use npm and bundle it with your application using
[Browserify](http://browserify.org).


## Development

Here is what you need:

 - `npm install` will install all the dev dependencies
 - `make` does all of the following
 - `make lint` lint the code with JSLint
 - `make test` runs all unit tests in Node
 - `make browser` generates a static web page at `test/all.html` to run the tests in a browser
 - `make phantom` runs all tests in a [headless WebKit](http://phantomjs.org/). Make sure `phantomjs` is in your path.

To build a standalone browserified package containing the merged / minified scripts run `make package`.
