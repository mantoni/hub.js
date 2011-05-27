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
 * Test cases for the singleton pattern.
 */
TestCase("SingletonPatternTest", {
	
	tearDown: function () {
		hub.reset();
	},

	"test singleton object": function () {
		var fn = sinon.spy();
		hub.peer("singleton", {
			method: fn
		});
		hub.publish("singleton/method");
		sinon.assert.calledOnce(fn);
	},

	"test singleton module": function () {
		var fn = sinon.spy();
		hub.singleton("singleton", function () {
			// private variables go here.
			return {
				method: fn
			};
		});
		hub.publish("singleton/method");
		sinon.assert.calledOnce(fn);
	}

});