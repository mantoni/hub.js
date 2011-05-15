/*jslint undef: true, white: true*/
/*globals Hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
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
		Hub.reset();
	},

	"test singleton object": function () {
		var fn = stubFn();
		Hub.peer("singleton", {
			method: fn
		});
		Hub.publish("singleton/method");
		assert(fn.called);
	},

	"test singleton module": function () {
		var fn = stubFn();
		Hub.peer("singleton", (function () {
			// private variables go here.
			return {
				method: fn
			};
		}()));
		Hub.publish("singleton/method");
		assert(fn.called);
	}

});