### Publish / Subscribe

At it's core, hub.js is an implementation of the [publish-subscribe
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

Anything following the event name is used as a arguments:

```js
hub.on('log', function (message) {
  console.log(message);
});
hub.emit('log', 'oh, hi!'); 
```

The `on` function allows to register multiple listeners:

```js
hub.on({
  'log': function (message) {
    console.log(message);
  },
  'warn': function (message) {
    console.warn(message);
  }
});
```


#### Call order

One of the design goals of hub.js is to guarantee a predictable call order of
listeners.

- Listeners are always called in registration order.
- The call order of "wildcard subscriptions" depends on where the wildcards are
  used: More generic listeners are called before more specific ones.

Wildcard subscriptions are explained further down on this page.


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


### Error handling

There are two ways to indicate an error condition:

1. An exception is thrown in a listener
2. A callback is invoked with a value as the first argument

Both cases are handled in the same way and in the following order:

- If the publisher passed a callback to `emit`, the callback is invoked with
  the error as the first argument
- If an error handler is registered next to the current event, the error is
  passed to the handler
- If a root error handler is registered, the error is passed to the handler
- The error is thrown

All examples below assume that we have this listener implementation:

```js
hub.on('something.throws', function () {
  throw new Error('whoups');
});
```

#### Error handling with callbacks

```js
hub.emit('something.throws', function (err) {
  if (err) {
    console.log('Something went wrong: ' + err);
  }
  // ...
});
```

#### Error handler on same namespace

If a bunch of related listeners should share the same error handler, for
example `ajax.get` and `ajax.post`, then a common `ajax.error` handler can help
avoid duplication.

```js
hub.on('something.error', function (err) {
  console.log('Something went wrong: ' + err);
});
```

#### Root error handler

This is a "catch all" handler that will cause the hub instance to never ever
throw any exceptions.

```js
hub.on('error', function (err) {
  console.log('Something went wrong: ' + err);
});
```

#### Exception handling

In case we do not pass a callback to `emit` and we don't have any of the above
error handlers installed, the error will be thrown by emit:

```js
try {
  hub.emit('something.throws');
} catch (err) {
  console.log('Something went wrong: ' + err);
}
```


### Special listeners

In addition to the usual listeners (see Publish / Subscribe), hub.js features
`before` and `after` listeners.

#### Before Listeners

When registering a listener with `before`, it will be invoked in a separate
event phase. The listener might decide to stop the event by calling
`this.stop()`.

The normal listeners (registered with `on`) will execute once all callback from
all matching `before` listeners returned. Especially `onceBefore` can be useful
to run prepare the actual implementation (e.g. fill a cache, check permissions,
etc ...).

#### After Listeners

Listeners registered with `after` are invoked in a separate event phase as
well. Unless all other listeners, the arguments passed are `(err, value)`,
which is the same that is passed to an `emit` callback.

The arguments passed along with `emit` are still accessible through
`this.args()`.


### Wildcard subscriptions

When subscribing to an event, the event name may contain wildcards.

The following example would match the events `ajax.get` and `ajax.post`:

```js
hub.on('ajax.*', function () { /* ... */ });
```

However, `ajax.\*` does not match `ajax.get.extended`. The dot acts as a
separator between event name parts. To match multiple event name parts, use a
double wildcard, e.g. `ajax.\*\*`.

If a subscriber is registered with an event that contains wildcards, it is
called a "matcher".

All matchers are invoked before any normal listeners. Matchers can prevent the
listeners from being executed by calling `this.stop()`.

Unless listeners, matchers do not get invoked in registration order. The more
generic matchers are invoked before the more specific ones, e.g. if `a.b.c` is
emitted, a listener on `a.\*\*` is invoked before a listener on `a.b.\*`.


### Broadcasting

Emitting an event with wildcards (\* or \*\*) is called "broadcasting". Any
listeners matching the given event will be invoked. This also applies for
"matchers" (see Wildcard subscriptions).

```js
hub.emit('**.destroy');
```


### Events emitted by hub.js

These events are emitted by each hub instance itself:

#### newListener

Calling `on`, `before`, `after`, `once`, `onceBefore` or `onceAfter` triggers a
`newListener` event passing the event name and the listener function as
arguments. If the event gets stopped (`this.stop()`), the listener will not be
registered.

#### removeListener

Calling `un` triggers a `removeListener` event passing the event name and the
listener function as arguments. If the event gets stopped (`this.stop()`), the
listener will not be removed.


### Views

A view is created with `hub.view('some.namespace')`. The returned object has
exactly the same API as the hub instance, but all operations are relative to
the specified namespace.

```js
var view = hub.view('some.namespace');

// Register a listener on 'some.namespace.event':
view.on('event', function () { /* ... */ });

// Emit an event on 'some.namespace.event':
view.emit('event');
```

#### This in listeners and callbacks

The `this` object in all listeners and callbacks is actually a view on the
parent of the emitted event:

```js
hub.on('ajax.post', function (data) {
  // ...
  this.emit('send', { data : data }); // Emits 'ajax.send'
});
```


### Event phases

Each event is emitted in 6 phases:

1. `before(*)`
2. `before(event)`
3. `on(*)`
4. `on(event)`
5. `after(event)`
6. `after(*)`

Where `*` is called a "matcher" and `event` is called a "listener".

Each phase is completed if all callbacks on all listeners where invoked. The
next phase in only executed if the previous one is complete. Calling
`this.stop()` will prevent the following phases from being executed.  Note that
other listeners on the same phase will still be invoked.

The first 4 phases will receive the arguments passed to emit. Phase 5 and 6
will receive `(err, value)`, which is the same as what gets passed to an `emit`
callback.

-----

### API reference

All listeners and callbacks are invoked with a special `this` object which is
described in the next section.

#### hubjs(\[listeners\])

The hub module exports a factory function which takes optional listeners and
returns a hub instance. All functions in the given listeners object will be
installed on the hub instance using on.

#### hub.on(event, function)

Registers a listener for an event (see "Publish / Subscribe"). The event may
contain \* or \*\* to register a "matcher". If the listener function expects
more arguments than are passed to `emit`, the last argument will be a callback
function. The listener is expected to invoke the callback once completed with
an error object or `null` and an optional return value.

#### hub.on(object)

Calls `hub.on` for each event / function pair in object. Functions on the
prototype of the object will be registered as well.

#### hub.on(prefix, object)

Calls `hub.on(event, function)` for each event / function pair in `object` with
the given prefix. The prefix and the object properties are joined with a dot.
Functions on the prototype of the object will be registered as well.

#### hub.addListener(...)

Is an alias for `hub.on`.

#### hub.before(event, function)

Like `on`, but invoked before listeners registered with `on` (see "Special
listeners" and "Event phases").

#### hub.before(object)

See `hub.before(event, function)` and `hub.on(object)`.

#### hub.before(prefix, object)

See `hub.before(event, function)` and `hub.on(prefix, object)`.

#### hub.after(event, function)

Like on, but invoked after listeners registered with on. The arguments passed
to the given function are the same as passed to a callback to emit (see
"Special listeners" and "Event phases").

#### hub.after(object)

See `hub.after(event, function)` and `hub.on(object)`.

#### hub.after(prefix, object)

See `hub.after(event, function)` and `hub.on(prefix, object)`.

#### hub.un(event, function)

Unregisters a single listener for an event.

#### hub.un(object)

Calls `hub.un(event, function)` for each event / function pair in `object` with
the given prefix. The prefix and the object properties are joined with a dot.
Functions on the prototype of the object will be registered as well.

#### hub.removeListener(...)

Is an alias for `hub.un`.

#### hub.removeAllListeners()

Unregisters all listeners.

#### hub.removeAllListeners(event)

Unregisters all listeners for the given event.

#### hub.removeAllMatching(event)

Unregisters all listeners that match the given event name. This removes all
listeners that would be invoked if the given event would be emitted.

#### hub.once(event, function)

Registers a listerner for an event that will be automatically unregistered on
the first invocation.

#### hub.onceBefore(event, function)

Like `once`, but registers the listener with `hub.before`.

#### hub.onceAfter(event, function)

Like `once`, but registers the listener with `hub.after`.

#### hub.emit(event\[, arg1, arg2, ...\]\[, callback\])

Invokes all listeners for an event. The optional arguments are passed to each
listener. The event may contain `*` or `**` to invoke all listeners registered
for matching events (see "Broadcasting"). The optional callback will be invoked
once all listeners returned. The first argument is an error if at least one of
the listeners threw, the second argument is the return value.

The given event can alternatively be an object containing at least an event
property. Optional properties can be:

- `allResults` _[Boolean]_: set to `true` to collect all listener return
  values and pass them to the given callback as an array. Default is `false`
  in which case only the last return value is passed.

Example:

```js
hub.emit({ event : 'some.event', allResults : true }, function (err, values) {
  // ...
});
```

#### hub.listeners(event)

Returns an array of all listeners for the given event. This does not include
matchers (see `hub.listenersMatching(event)`).

#### hub.listenersMatching(event)

Returns an array of all listeners that match the given event. This returns all
listeners that would be invoked if the given event would be emitted.

#### hub.view(namespace)

Creates a view object (instanceof `hub.View`) that implements the full hub API,
but maps all events relatively to the specified namespace (see "Views").


### API of 'this' in listeners

Listeners and callbacks are always called with a special scope object (`this`).
The exposed properties are not supposed to be modified.

#### hub

The hub instance.

#### event

The current event.

#### args

The arguments passed to emit without the event.

#### stop()

Prevent listener invocation on the following event phases.

#### stopped

true if stop() was called, otherwise false.

#### allResults

true if `emit` was call with `allResults` set to true, otherwise false.

#### callback([timeout])

Returns a callback that has to be invoked for the operation to complete.
Listeners may obtain mutliple callbacks. The next even phase will be entered
once all callbacks where invoked.

The optional timeout specifies the time in milliseconds after which the
callback will time out, resulting in a `TimeoutError`.
