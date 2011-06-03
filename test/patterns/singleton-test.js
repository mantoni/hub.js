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
/*TestCase("SingletonPatternTest", {
	
	tearDown: function () {
		hub.reset();
	},

	"test singleton object": function () {
		var spy = sinon.spy();
		hub.peer("singleton", {
			method: spy
		});
		hub.publish("singleton.method");
		sinon.assert.calledOnce(spy);
	},

	"test singleton module": function () {
		var spy = sinon.spy();
		hub.peer("singleton", function () {
			// private variables go here.
			return {
				method: spy
			};
		});
		hub.publish("singleton.method");
		sinon.assert.calledOnce(spy);
	}

});*/