# Changes

## 1.0.2

- Configure all "add" and "remove" events as internal

## 1.0.1

- Change project decription

## 1.0.0

- Completely rewritten from the ground up
- Cleaner API
- Dramatic performance improvements
- Highly modularized

## 0.14.0

__NOTE: This release introduces breaking changes to the API!__

This realease replaces `before`, `after`, related methods and the phase concept
with 'filters'. Filters are described in detail in the [documentation][].

Views are now implemented as a separate module: [hub-namespace][].

- Removed `before`, `after`, `onceBefore` and `onceAfter`.
- Removed `this.stop()` and `this.stopped`.
- Removed `un` and `view`.
- Removed the ability to register mutliple event listeners at once
  (`on({...})` and `on(prefix, {...})`).
- Matchers and listeners are not executed in separate phases anymore. Throwing
  in a matcher will still invoke the listeners.
- Adding a listener in a matcher will no longer execute the listener in the
  current emit call.
- Removed namespaced error events. Errors are only emitted to `error` listeners
  if present.
- Not emitting `error` events to matchers.
- Not emitting `newListener` and `removeListener` events to matchers.
- Renamed `removeAllMatching` to `removeMatchingListeners`.
- Added `addFilter`, `removeFilter`, `filterOnce`, `filters`,
  `filtersMatching`, `removeAllFilters`, `removeMatchingFilters`.
- Emitting `newFilter` and `removeFilter` events.
- Fix: Unsubscribing listeners registered with `once` did nothing.
- Upgraded consolify to v0.4.0 and added browser-reload.
- Added benchmarks and improved wildcard emit performance.

[documentation]: http://maxantoni.de/projects/hub.js/documentation.html
[hub-namespace]: https://github.com/mantoni/hub-namespace.js

## 0.13.0

__NOTE: This release introduces breaking changes to the API!__

- `hub.options` and `hub.Options` have been removed. Pass an object with the
  event name and the `allResults` flag as the first argument to `emit` instead.
- `this.options` does no longer exist. `this.allResults` is exposed directlry
  instead.

## 0.12.0

__NOTE: This release introduces breaking changes to the API!__

- `hub.options` and `hub.Options` have been removed. Pass an object with the
  event name and the `allResults` flag as the first argument to emit instead.
- `this.args` is now an array instead of function returning a copy of the
  emitted arguments
- `this.stopped` is now a boolean instead of a function returning a boolean
- `this.options.allResults` is now a boolean instead of a function returning
  a boolean
- Performance improvements and reduced call stack depth
- Using Browserify to create standalone browser module
- Run tests in Phantom.JS using Browserify and Phantomic
- Run tests in browsers with a standalone test HTML file generated with Consolify

## 0.11.0

- matcher '\*\*.x' is now invoked if emitting 'test.\*'
- removeAllListeners('test.\*') does not remove matcher '\*\*.x'
- removeAllMatchers('test.\*') does remove matcher '\*\*.x'
- listener(event) and listenersMatching(event) behave accordingly

## 0.9.0

- Fixed view.removeAllListeners()
- Invoking listeners that are registered during emit
- Improved test case failure messages

## 0.8.0

- Fix once, onceBefore and onceAfter with wildcards
- Fix for error events
- Fixed an issue with arguments being modified
- Changed documentation link to wiki page
- Replaced stategies with hub.options
- Up listen.js
- Fixed scope when calling emit on a view
- Test case naming
- Added test case for callback timeouts

## 0.7.0

- Emitting error events
- Not throwing if there are no listeners
- listenersMatching now also returns matching wildcard subscriptions
- Allowing colons in event names
