/*jslint undef: true*/
/*globals Hub stubFn AsyncTestCase fail assert assertFalse assertNull
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
 * Test cases for Hub.publish timeouts.
 */
AsyncTestCase("PublishTimeoutTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testSimpleTimeout: function(queue) {
		Hub.subscribe("a/b", function() {
			Hub.promise(10); // promise with small timeout, never resolved.
		});
		queue.call(function(pool) {
			var time = new Date().getTime();
			Hub.publish("a/b").then(function() {
				fail("Unexpected success callback");
			}, pool.add(function(error) {
				assertObject(error);
				assertEquals("timeout", error.type);
			}));
		});
	}

});
