### Creating instances

```js
var hubjs = require('hubjs');

var hub = hubjs.create();
```

### Publish / Subscribe

Hub.js is an extended implementation of the [publish-subscribe
pattern](http://en.wikipedia.org/wiki/Publish–subscribe_pattern).

A subscription is made like this:

```js
hub.on('event', function () {
  console.log('oh, hi!');
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
hub.emit('log', 'oh, hi!'); 
```

### Wildcard subscriptions

When subscribing to an event, the event name may contain glob style wildcards.

The following example matches the events `ajax.get` and `ajax.post`:

```js
hub.on('ajax.*', function () { /* ... */ });
```

However, `ajax.*` does not match `ajax.get.extended`. The dot acts as a
separator between event name parts. To match multiple event name parts, use a
double wildcard, e.g. `ajax.**`.

### Wildcard emit

When emitting an event, the event name may contain glob style wildcards. Any
filter and listener matching the given event will be invoked. This also applies
to whildcard subscriptions.

```js
hub.emit('**.destroy');
```

### Call order

Hub.js guarantees a predictable call order. The order is as follows:

1. Wildcard filters
2. Filters
3. Wildcard listeners
4. Listeners

Filters and Listeners are called in registration order. The call order of
"wildcard subscriptions" depends on where the wildcards are used: More generic
listeners are called before more specific ones. E.g. if `a.b.c` is emitted, a
listener on `a.**` is invoked before a listener on `a.b.*`.

For more information on wildcard priorities, see the [glob-tree match
expressions](https://github.com/mantoni/glob-tree.js#match-expressions)
documentation.

### Return values

Listeners may return a value to the publisher either by using the `return`
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

### Filters

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

Note that the callback values MUST always be an array.

### This in filter and listener

Filters and listeners are invoked with the same scope object with these
properties:

- `this.hub`: The hub instance the event was emitted on
- `this.event`: The emitted event
- `this.args`: The arguments passed to emit, without event and callback
- `this.allResults`: Whether the event was emitted with `allResults` set to
  `true`

### Error handling

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

### Events emitted by hub.js

Each hub instance emits these event on event handler registration /
deregistraion.

__NOTE:__ Unless events emitted using `emit`, these events are not passed to
wildcard subscribers. That is, if a filter or a listener was added with an
event name that contains a wildcard, the filter or listener will not be
invoked.

#### newListener

Calling `addListener`, `on` or `once` triggers a `newListener` event passing
the event name and the listener function as arguments. If a filter on this
event does not invoke `next`, the listener will not be registered.

#### removeListener

Calling `removeListener` triggers a `removeListener` event passing the event
name and the listener function as arguments. If a filter on this event does not
invoke `next`, the listener will not be removed.

#### newFilter

Calling `addFilter` or `filterOnce` triggers a `newFilter` event passing the
event name and the filter function as arguments. If a filter on this event
does not invoke `next`, the filter will not be registered.

#### removeFilter

Calling `removeFilter` triggers a `removeFilter` event passing the event name
and the filter function as arguments. If a filter on this event does not
invoke `next`, the filter will not be removed.

-----

### API reference

#### hubjs()

The hub module exports a factory function which returns a hub instance.

```js
var hub = hubjs();
```

#### hub.addListener(event, function)

Registers a listener for an event. The event may contain glob style wildcards
("\*" and "\*\*") to subscribe for all matching event. If the listener function
expects more arguments than are passed to `emit`, the last argument will be a
callback function. The listener is expected to invoke the callback once
completed with an error object or `null` and an optional return value.

#### hub.on(event, function)

Is an alias for `hub.addListener`.

#### hub.addFilter(event, function)

Registers a filter for an event. The event may contain glob style wildcards
("\*" and "\*\*") to subscribe for all matching event. The filter must take a
`next` function as it's first argument which has to be invoked in order to
execute the next filter or to execute the listeners. This way, filters
registered for the same event name form a chain.  A second argument
(`callback`) can be optionally provided to intercept the completion of an
event. A custom callback may be passed to `next`.

#### hub.removeListener(event, function)

Unregisters a single listener for an event.

#### hub.removeFilter(event, function)

Unregisters a single filter for an event.

#### hub.removeAllListeners()

Unregisters all listeners.

#### hub.removeAllListeners(event)

Unregisters all listeners for the given event.

#### hub.removeAllFilters()

Unregisters all filters.

#### hub.removeAllFilters(event)

Unregisters all filters for the given event.

#### hub.removeMatchingListeners(event)

Unregisters all listeners that match the given event name. This removes all
listeners that would be invoked if the given event would be emitted.

#### hub.removeMatchingFilters(event)

Unregisters all filters that match the given event name. This removes all
listeners that would be invoked if the given event would be emitted.

#### hub.removeAll()

Unregisters all filters and all listeners.

#### hub.once(event, function)

Registers a listener for an event that will be automatically unregistered on
the first invocation.

#### hub.filterOnce(event, function)

Registers a filter for an event that will be automatically unregistered on
the first invocation.

#### hub.emit(event\[, arg1, arg2, ...\]\[, callback\])

Invokes all listeners for an event. The optional arguments are passed to each
listener. The event may contain glob style wildcards ("\*" and "\*\*") to
invoke all listeners registered for matching events. The optional callback will
be invoked once all listeners returned. The first argument is an error if at
least one of the listeners threw, the second argument is the return value.

The given event can alternatively be an object containing at least an event
property. Optional properties can be:

- `allResults`: set to `true` to collect all listener return values and pass
  them to the given callback as an array. Default is `false` in which case only
  the last return value is passed.

Example:

```js
hub.emit({ event : 'some.event', allResults : true }, function (err, values) {
  // ...
});
```

#### hub.listeners(event)

Returns an array of all listeners for the given event. This does not include
matchers (see `hub.listenersMatching(event)`).

#### hub.filters(event)

Returns an array of all filters for the given event. This does not include
matchers (see `hub.filtersMatching(event)`).

#### hub.listenersMatching(event)

Returns an array of all listeners that match the given event. This returns all
listeners that would be invoked if the given event would be emitted.

#### hub.filtersMatching(event)

Returns an array of all filters that match the given event. This returns all
filters that would be invoked if the given event would be emitted.

#### this.callback([timeout])

Only available in listeners and not in filters.

Returns a callback that has to be invoked for the operation to complete.
Listeners may obtain mutliple callbacks. The listener invokation phase will
only return once all callbacks where invoked.

The optional timeout specifies the time in milliseconds after which the
callback will time out, resulting in a `TimeoutError`.
