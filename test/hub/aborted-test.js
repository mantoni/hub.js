/*jslint undef: true, white: true*/
/*globals hub sinon TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.aborted.
 */
TestCase("AbortedTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should implement aborted": function () {
		assertFunction(hub.aborted);
	},
	
	"test should return false by default": function () {
		assertFalse(hub.aborted());
	},
	
	"test should return true after stopPropagation": function () {
		hub.subscribe("a.b", function () {
			hub.stopPropagation();
		});
		hub.publish("a.b");
		assert(hub.aborted());
	}

});