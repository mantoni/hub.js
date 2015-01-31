# hub.js

[![Build Status]](https://travis-ci.org/mantoni/hub.js)
[![SemVer]](http://semver.org)
[![License]](https://github.com/mantoni/hub.js/blob/master/LICENSE)

The most advanced EventEmitter for Node and the browser.

# Features

- Node.js [EventEmitter][] compatible API
- Register listeners with glob event names (`*` and `**`)
- Emit events with glob event names (`*` and `**`)
- Register [filter chains][] for events with glob names (`*` and `**`)
- Pass a callback as the last argument to `emit` and receive asynchronous
  errors / return values from listeners
- Safely add and remove listeners and filters during event processing
- Test suite runs on Node.js 0.10, PhantomJS, Chrome, Firefox and IE 9 / 10
- 100% test coverage

## Install with npm

    npm install hubjs

## Browser support

Use [Browserify][] to create a standalone file.

## Creating instances

```js
var Hub = require('hubjs').Hub;

var hub = new Hub();
```

## Publish / Subscribe

Hub.js is an extended implementation of the [publish-subscribe
pattern](http://en.wikipedia.org/wiki/Publish–subscribe_pattern).

A subscription is made like this:

```js
hub.on('event', function () {
  console.log('Oh, hi!');
});
```

All listeners registered for `'event'` can be invoked using `emit`:

```js
hub.emit('event');
```

Anything following the event name is used as arguments:

```js
hub.on('log', function (message) {
  console.log(message);
});
hub.emit('log', 'Oh, hi!');
```

## Wildcard subscriptions

When subscribing to an event, the event name may contain glob style wildcards.

The following example matches the events `routes.get` and `routes.post`:

```js
hub.on('routes.*', function () { /* ... */ });
```

However, `routes.*` does not match `routes.get.extended`. The dot acts as a
separator between event name parts. To match multiple event name parts, use a
double wildcard, e.g. `routes.**`.

## Wildcard emit

When emitting an event, the event name may contain glob style wildcards. Any
filter and listener matching the given event will be invoked. This also applies
to whildcard subscriptions.

```js
hub.emit('**.destroy');
```

## Return values

Listeners may return a value to the publisher, either by using the `return`
keyword, or by using a callback.

```js
hub.on('answer', function () {
  return 42;
});
```

To use a callback, simply declare one:

```js
hub.on('answer', function (callback) {
  callback(null, 42); // Node style callbacks (err, value)
});
```

Both of the above examples will work with this publisher:

```js
hub.emit('answer', function (err, value) {
  assert.equal(value, 42);
});
```

This makes it possible to change listener implementations from synchronous to
asynchronous without changing the publishers.

By default, the return value of the last invoked listener is returned. To
obtain an array with all return values, invoke emit like this:

```js
hub.emit({ event : 'answer', allResults : true }, function (err, values) {
  assert.equal(values[0], 42);
});
```

## Filters

Filters are special functions that get invoked before the listeners. A filter
may delay or prevent listener execution, modify arguments and return values,
and add / remove listeners. If an event triggers multiple filters, they form a
queue.

A filter function is invoked with two arguments:

- `next`: a function that must be invoked by the filter to continue processing
- `callback`: a callback function that must be invoked to return from the call

A pass-through filter can be implemented like this:

```js
hub.addFilter('event', function (next) {
  // ...
  next();
});
```

Performing custom operations after an event was processed:

```js
hub.addFilter('event', function (next, callback) {
  next(function (err, values) {
    // ...
    callback(err, values);
  });
});
```

to pervent any further filters from being applied and to skip listener
execution, invoke the callback directly:

```js
hub.addFilter('event', function (next, callback) {
  callback(null, [42]);
});
```

Note that the callback values MUST ALWAYS be an array.

## This in filter and listener

Filters and listeners are invoked with the same scope object with these
properties:

- `this.event`: The emitted event
- `this.args`: The arguments passed to emit, without event and callback
- `this.allResults`: Whether the event was emitted with `allResults` set to
  `true`

The scope object can be changed in two ways:

1. If an object is passed as the first argument to `emit`, that object will be
   used as the scope object
2. When registering a listener or a filter, an object can be passed as the
   first argument with an `event` property and a `scope` property. The given
   scope will be used when invoking the listener without any modification.

## Error handling

There are two ways to indicate an error condition:

1. An exception is thrown in a listener
2. A callback is invoked with a value as the first argument

Both cases are handled in the same way and in this order:

- If the publisher passed a callback to `emit`, the callback is invoked with
  the error as the first argument
- If at least one error handler is registered (filter or listener), the error
  is emitted
- The error is thrown

Error handling with a callback:

```js
hub.emit('something.throws', function (err) {
  if (err) {
    console.log('Something went wrong: ' + err);
  }
  // ...
});
```

The error event is a "catch all" handler that will cause the hub instance to
never throw:

```js
hub.on('error', function (err) {
  console.log('Something went wrong: ' + err);
});
```

In case we do not pass a callback to `emit` and we don't have the above
error handler installed, the error will be thrown by emit:

```js
try {
  hub.emit('something.throws');
} catch (err) {
  console.log('Something went wrong: ' + err);
}
```

Caveat: If the error happens asynchronously, emit will not throw. The error
will be throw globally with no way of handling it properly.

## Events emitted by hub.js

Each hub instance emits these events on event handler registration /
deregistraion.

__NOTE:__ In contrast to events emitted with `emit`, these events are not
passed to wildcard subscribers. That is, if a filter or a listener was added
with an event name that contains a wildcard, the filter or listener will not be
invoked.

### newListener

Calling `addListener`, `on` or `once` triggers a `newListener` event passing
the event name and the listener function as arguments. If a filter on this
event does not invoke `next`, the listener will not be registered.

### removeListener

Calling `removeListener` triggers a `removeListener` event passing the event
name and the listener function as arguments. If a filter on this event does not
invoke `next`, the listener will not be removed.

### newFilter

Calling `addFilter` or `filterOnce` triggers a `newFilter` event passing the
event name and the filter function as arguments. If a filter on this event
does not invoke `next`, the filter will not be registered.

### removeFilter

Calling `removeFilter` triggers a `removeFilter` event passing the event name
and the filter function as arguments. If a filter on this event does not
invoke `next`, the filter will not be removed.

## Call order

Hub.js guarantees a predictable call order. The order is as follows:

1. Wildcard filters
2. Filters
3. Wildcard listeners
4. Listeners

While listeners are called in registration order, filters are called in reverse
registration order. The call order of "wildcard subscriptions" for listeners
and filters depends on where the wildcards are used: More generic listeners are
called before more specific ones. E.g. if `a.b.c` is emitted, a listener on
`a.**` is invoked before a listener on `a.b.*`.

For more information on wildcard priorities, see the [glob-tree match
expressions][match-expression] documentation.

## API

Inherits from [async-glob-events][]`.AsyncEmitter` and has the [glob-filter][]
API mixed in.

- `emit(event, ...)`: Invokes the filter chain for the given event before
  invoking the listeners. After all listeners returned, the filter callback
  chain is invoked.
- `removeAll([event])`: Unregisters all filters and all listeners, or the
  filters and listeners registered for the given event. Matching rules are not
  applied. This means `removeAll('*')` will remove listeners registered for
  `'*'`, but it will not remove listeners registered for `'event'`.

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
[match-expressions]: https://github.com/mantoni/glob-tree.js#match-expressions
