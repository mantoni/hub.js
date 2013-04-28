# Changes

## v0.12.0

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
