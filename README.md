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

## API

 - `hub([listeners])` - the hub module exports a factory function which takes optional listeners and returns a hub instance. All functions in the given listeners object will be installed on the hub instance using `on`.
 - `hub.on(event, function)` - registers a listener for an event. The event may contain `*` or `**` to register a "matcher" (see below). If the listener function expects more arguments than are passed to `emit`, the last argument will be a callback function. The listener is expected to invoke the callback once completed with an error object or `null` and a single return value.
 - `hub.un(event)` - unregisters all listeners for the given event.
 - `hub.un(event, function)` - unregisters a single listener for an event.
 - `hub.once(event, function)` - registers a listerner for an event that will be automatically unregistered on the first invocation.
 - `hub.emit(event[, arg1, arg2, ...][[, strategy], callback])` - invokes all listeners for an event. The optional arguments are passed to each listener. The event may contain `*` or `**` to invoke all listeners registered for matching events (broadcasting). The optional callback will be invoked once all listeners returned. The first argument is an error if at least one of the listeners threw, the second argument is a return value. If a callback is given, the optional strategy filters the return values of the listeners. By default the strategy `hub.LAST` is used.

### Matchers

A "matcher" is an event that contains at least one `*`. A single `*` matches a of an event name and stops at a dot while a `**` does not stop at a dot.
Matchers are different from listeners in these points:

 - they get invoked before the listeners allowing AOPish usage
 - the invocation order is not in registration order as for listeners, but follows special rules
 - the scope is set to a special object providing additional features

The API of the `this` object passed to matchers:

 - `event` - the current event
 - `stop()` - prevents listener execution. This does not prevent other matchers from being invoked.
 - `beforeReturn(function)` - registers a function that gets invoked before the callback that was passed to `emit`.
 - `afterReturn(function)` - registers a function that gets invoked after the callback that was passed to `emit`.

### Strategies

 - `LAST` - returns the last non-undefined value
 - `CONCAT` - returns an array of all listener return values

## Run tests

```
make
```

## Compile for browsers and minify

This requires [nomo.js](https://github.com/mantoni/nomo.js).

```
make compile
```
