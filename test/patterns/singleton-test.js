/*jslint undef: true, white: true*/
/*globals hub sinon TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertBoolean assertString assertFunction assertObject assertArray
	assertException assertNoException
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
		var spy = sinon.spy();
		hub.on("singleton", {
			method: spy
		});
		
		hub.emit("singleton.method", 123, "test");
		
		sinon.assert.calledOnce(spy);
		sinon.assert.calledWith(spy, 123, "test");
	},

	"test singleton module": function () {
		var spy = sinon.spy();
		hub.peer("singleton", function () {
			return {
				method: spy
			};
		});
		
		hub.emit("singleton.method", 123, "test");
		
		sinon.assert.calledOnce(spy);
		sinon.assert.calledWith(spy, 123, "test");
	}

});