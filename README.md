# hub.js

[![Build Status]](https://travis-ci.org/mantoni/hub.js)
[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/hub.js/blob/master/LICENSE)

Pub/Sub oriented JavaScript - For Node.js and the browser

# Features

- Node.js [EventEmitter][] compatible API
- Register listeners with glob event names (`*` and `**`)
- Emit events with glob event names (`*` and `**`)
- Register [filter chains][] for events with glob names (`*` and `**`)
- Pass a callback as the last argument to `emit` and receive asynchronous
  errors and return values from listeners
- Add and remove listeners and filters during event processing
- Test suite runs on Node.js 0.10, PhantomJS, Chrome, Firefox and IE 9 / 10
- 100% test coverage

## Install with npm

    npm install hubjs

## Browser support

Use [Browserify][] to create a standalone file.

## Usage

```js
var Hub = require('hubjs').Hub;

var hub = new Hub();
```


## Hub API

This implementation is highly modular. `Hub` inherits from
[async-glob-events][]`.AsyncEmitter` and has the [glob-filter][] API mixed in.



## Deduped dependency tree

    hubjs
    ├── async-glob-events
    ├─┬ glob-events
    │ └─┬ glob-store
    │   ├─┬ glob-tree
    │   │ └── live-tree
    │   └── live-list
    ├─┬ glob-filter
    │ └── min-filter
    ├── inherits
    ├── listen
    └── min-iterator

## Development

 - `npm install` to install the dev dependencies
 - `npm test` to lint, run tests on Node and PhantomJS and check code coverage

## License

MIT

[Build Status]: http://img.shields.io/travis/mantoni/hub.js.svg
[SemVer]: http://img.shields.io/:semver-%E2%9C%93-brightgreen.svg
[License]: http://img.shields.io/npm/l/hubjs.svg
[Browserify]: http://browserify.org
[EventEmitter]: http://nodejs.org/api/events.html
[filter chains]: https://github.com/mantoni/glob-filter.js
[async-glob-events]: https://github.com/mantoni/async-glob-events.js
[glob-filter]: https://github.com/mantoni/glob-filter.js
