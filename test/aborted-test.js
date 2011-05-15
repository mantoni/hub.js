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
 * Test cases for Hub.aborted.
 */
TestCase("AbortedTest", {
	
	tearDown: function () {
		Hub.reset();
	},
	
	"test should implement aborted": function () {
		assertFunction(Hub.aborted);
	},
	
	"test should return false by default": function () {
		assertFalse(Hub.aborted());
	},
	
	"test should return true after stopPropagation": function () {
		Hub.subscribe("a/b", function () {
			Hub.stopPropagation();
		});
		Hub.publish("a/b");
		assert(Hub.aborted());
	}

});