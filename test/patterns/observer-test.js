/*jslint undef: true, white: true*/
/*globals hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
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
		
		hub.singleton("Observable", function () {
			return {
				notify: function () {
					hub.publish("Observer/notify");
				}
			};
		});
				
		var invokations = 0;
		hub.peer("Observer", function () {
			this.subscribe("notify", function () {
				invokations++;
			});
			return {
				/* ... */
			};
		});
		
		hub.get("Observer");
		hub.get("Observer");
		hub.get("Observable").notify();
		
		assertEquals(2, invokations);
	}

});