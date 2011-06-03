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
	/*
	tearDown: function () {
		hub.reset();
	},

	"test abserver": function () {
		
		hub.peer("Document", function () {
			var text = "";
			return {
				change: function (newText) {
					text = newText;
					hub.publish("Observer.notify", text);
				}
			};
		});

		var spy = sinon.spy();
		hub.peer("Observer", function () {
			this.subscribe("notify", spy);
			return {
				// ...
			};
		});
		
		hub.get("Observer");
		hub.get("Observer");
		
		var text = "Hello Observer!";
		hub.publish("Document.change", text);
		
		sinon.assert.calledTwice(spy);
		sinon.assert.alwaysCalledWith(spy, text);
	}*/

});