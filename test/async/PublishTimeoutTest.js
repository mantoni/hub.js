/*jslint undef: true, white: true*/
/*globals hub sinon AsyncTestCase fail assert assertFalse assertNull
	assertNotNull assertUndefined assertNotUndefined assertSame assertNotSame
	assertEquals assertFunction assertObject assertArray assertException
	assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.emit timeouts.
 */
AsyncTestCase("EmitTimeoutTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	testSimpleTimeout: function (queue) {
		hub.on("a.b", function () {
			hub.promise(10); // promise with small timeout, never resolved.
		});
		queue.call(function (pool) {
			var time = new Date().getTime();
			hub.emit("a.b").then(function () {
				fail("Unexpected success callback");
			}, pool.add(function (error) {
				assertObject(error);
				assertEquals("timeout", error.type);
			}));
		});
	}

});
