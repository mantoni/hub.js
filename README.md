# hub.js

Pub/Sub oriented JavaScript - http://mantoni.github.com/hub.js

[![Build Status](https://secure.travis-ci.org/mantoni/hub.js.png?branch=rewrite)](http://travis-ci.org/mantoni/hub.js)

## Install

```
npm install hubjs
```

## Usage

```js
var hubjs = require('hubjs');
var hub = hubjs();
```

### Publish / Subscribe

```js
hub.on('some.event', function (a, b) {
  // ...
});
hub.emit('some.event', 'any', 'args');
```

### Return values

```js
hub.on('answer', function () {
  return 42;
});
hub.emit('answer', function (err, value) {
  console.log(value);
});
```

### Callbacks

```js
hub.on('answer', function (callback) {
  callback(null, 42);
});
hub.emit('answer', function (err, value) {
  console.log(value);
});
```

### Errors

```js
hub.on('answer', function () {
  throw new Error('ouch!');
});
hub.emit('answer', function (err) {
  console.log(err);
});
```

### Wildcard Subscriptions

```js
hub.on('**', function () {
  console.log('hub event ' + this.event);
});

hub.on('server.*', function (data) {
  if (!data) {
    console.warn('No data passed to ' + this.event + '. Aborting.');
    this.stop();
  }
});
```

### Wildcard Emit

```js
hub.emit('module.**.start');

hub.emit('**.destroy');
```

### Strategies

```js
hub.on('answer.a', function () { return 2; });
hub.on('answer.b', function () { return 3; });
hub.on('answer.c', function () { return 7; });

hub.emit('answer.*', hubjs.CONCAT, function (err, results) {
  console.log(results.join(' * ')); // = 2 * 3 * 7
});
```

## Run tests

```
make
```

## Compile for browsers and minify

This requires [nomo.js](https://github.com/mantoni/nomo.js).

```
make compile
```
