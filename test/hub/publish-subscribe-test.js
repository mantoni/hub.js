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
 * Test cases for publish and subscribe.
 */
TestCase("PublishSubscribeTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test publish calls subscriber with same topic": function () {
		var fn = stubFn();
		hub.subscribe("x/y", fn);
		hub.publish("x/y");
		assert(fn.called);
	},
	
	"test publish does not call subscriber with different topic": function () {
		var fn = stubFn();
		hub.subscribe("a/b", fn);
		hub.publish("x/y");
		assertFalse(fn.called);
	},
	
	"test publish one argument": function () {
		var value1;
		hub.subscribe("x/y", function (arg1) {
			value1 = arg1;
		});
		hub.publish("x/y", "first");
		assertEquals("first", value1);
	},
	
	"test publish two arguments": function () {
		var value1, value2;
		hub.subscribe("x/y", function (arg1, arg2) {
			value1 = arg1;
			value2 = arg2;
		});
		hub.publish("x/y", "first", "second");
		assertEquals("first", value1);
		assertEquals("second", value2);
	},
	
	"test publish on topic with two subscribers": function () {
		var m = [];
		hub.subscribe("x/y", function () {
			m.push("a");
		});
		hub.subscribe("x/y", function () {
			m.push("b");
		});
		hub.publish("x/y");
		// First b, then a since second overrides first:
		assertEquals("b,a", m.join());
	},
	
	"test publish to two subscribers via wildcard message": function () {
		var m = [];
		hub.subscribe("x/a", function () {
			m.push("a");
		});
		hub.subscribe("x/b", function () {
			m.push("b");
		});
		hub.subscribe("y/c", function () {
			m.push("c");
		});
		hub.publish("x/*");
		// b overrides a:
		assertEquals("b,a", m.join());
	},
	
	"test publish to two subscribers via wildcard namespace": function () {
		var m = [];
		hub.subscribe("x/a", function () {
			m.push("a");
		});
		hub.subscribe("y/a", function () {
			m.push("b");
		});
		hub.subscribe("z/b", function () {
			m.push("c");
		});
		hub.publish("*/a");
		// y overrides x:
		assertEquals("b,a", m.join());
	},
	
	"test publish to wildcard, subscribe another, publish again": function () {
		var fn1 = stubFn();
		hub.subscribe("x/a", fn1);
		hub.publish("x/*");
		assert(fn1.called);
		var fn2 = stubFn();
		hub.subscribe("x/b", fn2);
		fn1.called = false;
		hub.publish("x/*");
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test subscribe to wildcard": function () {
		var fn = stubFn();
		hub.subscribe("x/*", fn);
		hub.publish("y/a");
		assertFalse(fn.called);
		hub.publish("x/a");
		assert(fn.called);
	},
	
	"test publish with placeholder in message": function () {
		var fn = stubFn();
		hub.subscribe("x/y", fn);
		hub.publish("x/{0}", "y");
		assert(fn.called);
		fn.called = false;
		hub.publish("x/{0.m}", {m: "y"});
		assert(fn.called);
	},
	
	"test subscribe publish subscribe same message": function () {
		var fn1 = stubFn();
		hub.subscribe("x/y", fn1);
		hub.publish("x/y");
		assert(fn1.called);
		fn1.called = false;
		var fn2 = stubFn();
		hub.subscribe("x/y", fn2);
		hub.publish("x/y");
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test subscribe publish subscribe same message w/ placeholder": function () {
		var fn1 = stubFn();
		hub.subscribe("x/y", fn1);
		hub.publish("x/{0}", "y");
		assert(fn1.called);
		fn1.called = false;
		var fn2 = stubFn();
		hub.subscribe("x/y", fn2);
		hub.publish("x/{0}", "y");
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test multicast publish and subscribe": function () {
		var fnx = stubFn();
		hub.subscribe("x/*", fnx);
		hub.publish("x/*");
		assert(fnx.called);
	},
	
	"test multicast subscriber invoked once": function () {
		var count = 0;
		var fn = function () {
			count++;
		};
		var fna = stubFn();
		var fnb = stubFn();
		hub.subscribe("x/a", fna);
		hub.subscribe("x/b", fnb);
		hub.subscribe("x/*", fn);
		hub.publish("x/*");
		assert(fna.called);
		assert(fnb.called);
		assertEquals(1, count);
	},
	
	"test multicast publish twice": function () {
		var count = 0;
		var fn = function () {
			count++;
		};
		hub.subscribe("x/a", fn);
		hub.publish("x/*");
		assertEquals(1, count);
		hub.publish("x/*");
		assertEquals(2, count);
	},
	
	"test throw in subscriber": function () {
		hub.subscribe("test/throw", function () {
			throw new Error();
		});
		assertException(function () {
			hub.publish("test/throw");
		});
	}
	
});
