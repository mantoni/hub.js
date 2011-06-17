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
 * Test cases for the observer pattern.
 */
TestCase("ObserverPatternTest", {
	
	tearDown: function () {
		hub.reset();
	},

	"test abserver": function () {
		
		hub.peer("Document", function () {
			var text = "";
			return {
				append: function (newText) {
					text += newText;
					this.emit("changed", text);
				}
			};
		});

		var spy = sinon.spy();
		hub.on("observer.create", hub.factory(function () {
			hub.on("Document.changed", spy);
		}));
		
		// Create two observers:
		hub.emit("observer.create");
		hub.emit("observer.create");
				
		hub.emit("Document.append", "Hello Observer!");
		
		sinon.assert.calledTwice(spy);
		sinon.assert.alwaysCalledWith(spy, "Hello Observer!");
	}

});