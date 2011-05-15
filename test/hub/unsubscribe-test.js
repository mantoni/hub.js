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
 * Test cases for hub.unsubscribe.
 */
TestCase("UnsubscribeTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test simple unsubscribe": function () {
		var fn = stubFn();
		hub.subscribe("x/y", fn);
		hub.publish("x/y");
		assert(fn.called);
		fn.called = false;
		hub.unsubscribe("x/y", fn);
		hub.publish("x/y");
		assertFalse(fn.called);
	},
	
	"test unsubscribe first in chain of two": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		hub.subscribe("x/y", f1);
		hub.subscribe("x/y", f2);
		hub.publish("x/y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x/y", f1);
		hub.publish("x/y");
		assertEquals("f2", a.join());
	},
	
	"test unsubscribe second in chain of two": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		hub.subscribe("x/y", f1);
		hub.subscribe("x/y", f2);
		hub.publish("x/y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x/y", f2);
		hub.publish("x/y");
		assertEquals("f1", a.join());
	},
	
	"test unsubscribe first in chain of three": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		var f3 = function () {
			a.push("f3");
		};
		hub.subscribe("x/y", f1);
		hub.subscribe("x/y", f2);
		hub.subscribe("x/y", f3);
		hub.publish("x/y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x/y", f1);
		hub.publish("x/y");
		assertEquals("f3,f2", a.join());
	},
	
	"test unsubscribe second in chain of three": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		var f3 = function () {
			a.push("f3");
		};
		hub.subscribe("x/y", f1);
		hub.subscribe("x/y", f2);
		hub.subscribe("x/y", f3);
		hub.publish("x/y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x/y", f2);
		hub.publish("x/y");
		assertEquals("f3,f1", a.join());
	},
	
	"test unsubscribe third in chain of three": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		var f3 = function () {
			a.push("f3");
		};
		hub.subscribe("x/y", f1);
		hub.subscribe("x/y", f2);
		hub.subscribe("x/y", f3);
		hub.publish("x/y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x/y", f3);
		hub.publish("x/y");
		assertEquals("f2,f1", a.join());
	},
	
	"test publish subscribe publish unsubscribe publish": function () {
		var fn = stubFn();
		hub.publish("x/y");
		hub.subscribe("x/y", fn);
		hub.publish("x/y");
		assert(fn.called);
		fn.called = false;
		hub.unsubscribe("x/y", fn);
		hub.publish("x/y");
		assertFalse(fn.called);
	},
	
	"test subscribe publish wildcard and unsubscribe": function () {
		var fn = stubFn();
		hub.subscribe("x/y", fn);
		hub.publish("x/*");
		assert(fn.called);
		fn.called = false;
		hub.unsubscribe("x/y", fn);
		hub.publish("x/*");
		assertFalse(fn.called);
	},
	
	"test unsubscribe throws if callback is not a function": function () {
		assertException(function () {
			hub.unsubscribe("x/y");
		});
		assertException(function () {
			hub.unsubscribe("x/y", null);
		});
		assertException(function () {
			hub.unsubscribe("x/y", true);
		});
		assertException(function () {
			hub.unsubscribe("x/y", {});
		});
		assertException(function () {
			hub.unsubscribe("x/y", []);
		});
	},
	
	"test unsubscribe returns true on success": function () {
		var fn = function () {};
		hub.subscribe("x/y", fn);
		assert(hub.unsubscribe("x/y", fn));
	},
	
	"test unsubscribe returns false on failure": function () {
		assertFalse(hub.unsubscribe("x/y", function () {}));
	}
	
});