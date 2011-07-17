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
 * Test cases for the abstarct factory pattern.
 */
TestCase("FactoryPatternTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test abstract factory": function () {
		// Sample factory implementation:
		hub.peer("example.factory", function () {
			return {
				"create.a": function () {
					return "A";
				},
				"create.b": function () {
					return "B";
				}
			};
		});
		var spyA = sinon.spy();
		var spyB = sinon.spy();
		
		// Associate "abstract" topic with implementation:
		hub.on("factory.create.{0}",
			hub.does.emit("example.factory.create.{0}"));
		
		// Use "abstract" topic:
		hub.emit("factory.create.a").then(spyA);
		hub.emit("factory.create.b").then(spyB);
		
		sinon.assert.calledOnce(spyA);
		sinon.assert.calledWith(spyA, "A");
		sinon.assert.calledOnce(spyB);
		sinon.assert.calledWith(spyB, "B");
	}

});