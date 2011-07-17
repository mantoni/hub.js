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
 * Test cases for the observer pattern.
 */
TestCase("ObserverPatternTest", {
	
	tearDown: function () {
		hub.reset();
	},

	"test abserver": function () {
		hub.peer("document", function () {
			var text = "";
			return {
				append: function (newText) {
					text += newText;
					this.emit("changed", text);
				}
			};
		});
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		hub.on("document.changed", spy1);
		hub.on("document.changed", spy2);

		hub.emit("document.append", "Hello Observers!");
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.alwaysCalledWith(spy1, "Hello Observers!");
		sinon.assert.calledOnce(spy2);
		sinon.assert.alwaysCalledWith(spy2, "Hello Observers!");
	}

});