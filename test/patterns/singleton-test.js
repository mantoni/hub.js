/*jslint undef: true, white: true*/
/*globals hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for the singleton pattern.
 */
TestCase("SingletonTest", {
	
	tearDown: function () {
		hub.reset();
	},

	"test singleton object": function () {
		var fn = stubFn();
		hub.peer("singleton", {
			method: fn
		});
		hub.publish("singleton/method");
		assert(fn.called);
	},

	"test singleton module": function () {
		var fn = stubFn();
		hub.peer("singleton", (function () {
			// private variables go here.
			return {
				method: fn
			};
		}()));
		hub.publish("singleton/method");
		assert(fn.called);
	}

});