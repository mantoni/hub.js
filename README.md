# hub.js

Pub/Sub oriented JavaScript - http://mantoni.github.com/hub.js

[![Build Status](https://secure.travis-ci.org/mantoni/hub.js.png?branch=rewrite)](http://travis-ci.org/mantoni/hub.js)

## Install

```
npm install hubjs
```

You can also download a browser package from https://github.com/mantoni/hub.js/downloads or `make compile` it yourself.

## Usage

### Instantiation

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

### Return Values

```js
hub.on('answer', function () {
  return 42;
});
hub.emit('answer', function (err, value) {
  console.log(value);
});
```

### Callbacks

Simply define an (additional) callback argument:

```js
hub.on('answer', function (callback) {
  callback(null, 42);
});
hub.emit('answer', function (err, value) {
  console.log(value);
});
```

Alternatively, call `this.callback()` to obtain a callback, or even multiple callbacks that will be waited for.

### Exception Handling

```js
hub.on('answer', function () {
  throw new Error('ouch!');
});
hub.emit('answer', function (err) {
  console.log(err);
});
```

Exceptions from multiple listeners will be merged into an `ErrorList` with an `errors` array containing all the original exceptions.

### Wildcard Subscriptions

`*` matches `test`, but not `test.two`, while `**` matches both. `test.*` matches `test.one` but not `one.test`.
Unless normal listeners, matchers do not get invoked in registration order. The more generic matchers get invoked before the more specific ones, e.g. `a.**` is invoked before `a.b.*` if `a.b.c` is emitted.

```js
hub.on('**', function () {
  console.log('hub event ' + this.event + '(' + this.args().join(', ') + ')');
});

hub.before('server.*', function (data) {
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

### Event Phases

Each event is emitted in 6 phases:

 1. `before(*)`
 2. `before(event)`
 3. `on(*)`
 4. `on(event)`
 5. `after(event)`
 6. `after(*)`

Each phase is completed if all callbacks on all listeners where invoked. The next phase in only executed if the previous one is complete.
Calling `this.stop()` will prevent the following phases from being executed. Note that other listeners on the same phase will still be invoked.

The first 4 phases will receive the arguments passed to emit. Phase 5 and 6 will receive `(err, value)`, which is the same as what gets passed to an  `emit` callback.

### Strategies

Strategies are functions that take an array of non-undefined values and return a result of any type.

```js
hub.on('answer.a', function () { return 2; });
hub.on('answer.b', function () { return 3; });
hub.on('answer.c', function () { return 7; });

hub.emit('answer.*', hubjs.CONCAT, function (err, results) {
  console.log(results.join(' * ')); // = 2 * 3 * 7
});
```

These strategies are pre-defined:

 - `LAST` - returns the last non-undefined value
 - `CONCAT` - returns an array of all non-undefined listener return values

## API

##### `hub([listeners])`
The hub module exports a factory function which takes optional listeners and returns a hub instance. All functions in the given listeners object will be installed on the hub instance using `on`.

##### `hub.on(event, function)`
Registers a listener for an event. The event may contain `*` or `**` to register a "matcher" (see below). If the listener function expects more arguments than are passed to `emit`, the last argument will be a callback function. The listener is expected to invoke the callback once completed with an error object or `null` and a single return value.

##### `hub.before(event, function)`
Like on, but invoked before listeners registered with `on`.

##### `hub.after(event, function)`
Like on, but invoked after listeners registered with `on` and gets invoked with the arguments `(err, value)`.

##### `hub.un(event)`
Unregisters all listeners for the given event.

##### `hub.un(event, function)`
Unregisters a single listener for an event.

##### `hub.once(event, function)`
Registers a listerner for an event that will be automatically unregistered on the first invocation.

##### `hub.emit(event[, arg1, arg2, ...][[, strategy], callback])`
Invokes all listeners for an event. The optional arguments are passed to each listener. The event may contain `*` or `**` to invoke all listeners registered for matching events (broadcasting). The optional callback will be invoked once all listeners returned. The first argument is an error if at least one of the listeners threw, the second argument is the return value. If a callback is given, the optional strategy filters the return values of the listeners. By default the strategy `hub.LAST` is used.

### this in listeners

The API of the `this` object in all listeners and callbacks:

##### `hub`
The hub instance.

##### `event`
The current event.

##### `args()`
Returns a copy of the arguments passed to emit following the event.

##### `stop()`
Prevent listener invocation on the following event phases.

##### `stopped()`
Returns true if `stop()` was called.

##### `callback()`
Returns a callback that has to be invoked for the operation to complete. Listeners may obtain mutliple callbacks.

### events

Calling `on`, `before`, `after` or `once` triggers a `newListener` event passing the event name and the listener function as arguments. If the event gets stopped (`this.stop()`) the listener will not be registered.

## Run tests

```
make
```

## Run tests in your browser

This requires [nomo.js](https://github.com/mantoni/nomo.js).

```
nomo server
```

Open http://localhost:4444/test in your browser.

## Compile for browsers and minify

```
make compile
```
