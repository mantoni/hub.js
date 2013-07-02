# Changes

## v0.14.0

- Fix: Unsubscribing listeners registered with `once`, `onceBefore` or
  `onceAfter` did nothing.

## v0.13.0

__NOTE: This release introduces breaking changes to the API!__

- `hub.options` and `hub.Options` have been removed. Pass an object with the
  event name and the `allResults` flag as the first argument to `emit` instead.
- `this.options` does no longer exist. `this.allResults` is exposed directlry
  instead.

## v0.12.0

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

## v0.11.0

- matcher '\*\*.x' is now invoked if emitting 'test.\*'
- removeAllListeners('test.\*') does not remove matcher '\*\*.x'
- removeAllMatchers('test.\*') does remove matcher '\*\*.x'
- listener(event) and listenersMatching(event) behave accordingly

## v0.9.0

- Fixed view.removeAllListeners()
- Invoking listeners that are registered during emit
- Improved test case failure messages

## v0.8.0

- Fix once, onceBefore and onceAfter with wildcards
- Fix for error events
- Fixed an issue with arguments being modified
- Changed documentation link to wiki page
- Replaced stategies with hub.options
- Up listen.js
- Fixed scope when calling emit on a view
- Test case naming
- Added test case for callback timeouts

## v0.7.0

- Emitting error events
- Not throwing if there are no listeners
- listenersMatching now also returns matching wildcard subscriptions
- Allowing colons in event names
