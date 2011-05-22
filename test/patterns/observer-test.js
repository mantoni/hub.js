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
		
		// The Observable singleton peer:
		hub.singleton("Observable", function () {
			var observers = [];
			return {
				observe: function (observer) {
					observers.push(observer);
				},
				notify: function () {
					var i, l;
					for (i = 0, l = observers.length; i < l; i++) {
						observers[i].onChange();
					}
				}
			};
		});
		
		var instances = 0;
		var invocations = 0;
		
		// The Observer prototype peer:
		hub.peer("Observer", function () {
			instances++;
			return {
				onChange: function () {
					invocations++;
				}
			};
		});
		
		var observable = hub.get("Observable");
		observable.observe(hub.get("Observer"));
		assertEquals(1, instances);
		observable.observe(hub.get("Observer"));
		// ^-- same as hub.publish("Observable/observe", hub.get("Observer"));
		assertEquals(2, instances);
		assertEquals(0, invocations);
		observable.notify();
		// ^-- same as hub.publish("Observable/notify");
		assertEquals(2, invocations);
	}

});