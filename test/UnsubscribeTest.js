/*jslint undef: true*/
/*globals Hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.unsubscribe.
 */
TestCase("UnsubscribeTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * basic unsubscribe functionality.
	 */
	testSimpleUnsubscribe: function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.publish("x/y");
		assert(fn.called);
		fn.called = false;
		Hub.unsubscribe("x/y", fn);
		Hub.publish("x/y");
		assertFalse(fn.called);
	},
	
	testUnsubscribeFirstInChainOfTwo: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		Hub.subscribe("x/y", f1);
		Hub.subscribe("x/y", f2);
		Hub.publish("x/y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x/y", f1);
		Hub.publish("x/y");
		assertEquals("f2", a.join());
	},
	
	testUnsubscribeSecondInChainOfTwo: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		Hub.subscribe("x/y", f1);
		Hub.subscribe("x/y", f2);
		Hub.publish("x/y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x/y", f2);
		Hub.publish("x/y");
		assertEquals("f1", a.join());
	},
	
	testUnsubscribeFirstInChainOfThree: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		var f3 = function() {
			a.push("f3");
		};
		Hub.subscribe("x/y", f1);
		Hub.subscribe("x/y", f2);
		Hub.subscribe("x/y", f3);
		Hub.publish("x/y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x/y", f1);
		Hub.publish("x/y");
		assertEquals("f3,f2", a.join());
	},
	
	testUnsubscribeSecondInChainOfThree: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		var f3 = function() {
			a.push("f3");
		};
		Hub.subscribe("x/y", f1);
		Hub.subscribe("x/y", f2);
		Hub.subscribe("x/y", f3);
		Hub.publish("x/y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x/y", f2);
		Hub.publish("x/y");
		assertEquals("f3,f1", a.join());
	},
	
	testUnsubscribeThirdInChainOfThree: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		var f3 = function() {
			a.push("f3");
		};
		Hub.subscribe("x/y", f1);
		Hub.subscribe("x/y", f2);
		Hub.subscribe("x/y", f3);
		Hub.publish("x/y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x/y", f3);
		Hub.publish("x/y");
		assertEquals("f2,f1", a.join());
	},
	
	"test publish subscribe publish unsubscribe publish": function() {
		var fn = stubFn();
		Hub.publish("x/y");
		Hub.subscribe("x/y", fn);
		Hub.publish("x/y");
		assert(fn.called);
		fn.called = false;
		Hub.unsubscribe("x/y", fn);
		Hub.publish("x/y");
		assertFalse(fn.called);
	},
	
	"test subscribe publish wildcard and unsubscribe": function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.publish("x/*");
		assert(fn.called);
		fn.called = false;
		Hub.unsubscribe("x/y", fn);
		Hub.publish("x/*");
		assertFalse(fn.called);
	},
	
	"test unsubscribe throws error if callback is not a function": function() {
		assertException(function() {
			Hub.unsubscribe("x/y");
		});
		assertException(function() {
			Hub.unsubscribe("x/y", null);
		});
		assertException(function() {
			Hub.unsubscribe("x/y", true);
		});
		assertException(function() {
			Hub.unsubscribe("x/y", {});
		});
		assertException(function() {
			Hub.unsubscribe("x/y", []);
		});
	},
	
	"test unsubscribe returns true on success": function() {
		var fn = function() {};
		Hub.subscribe("x/y", fn);
		assert(Hub.unsubscribe("x/y", fn));
	},
	
	"test unsubscribe returns false on failure": function() {
		assertFalse(Hub.unsubscribe("x/y", function() {}));
	}

	// unsubscribe
});