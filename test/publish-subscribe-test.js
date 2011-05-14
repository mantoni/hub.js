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
 * Test cases for publish and subscribe.
 */
TestCase("PublishSubscribeTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test publish calls subscriber with same topic": function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.publish("x/y");
		assert(fn.called);
	},
	
	"test publish does not call subscriber with different topic": function() {
		var fn = stubFn();
		Hub.subscribe("a/b", fn);
		Hub.publish("x/y");
		assertFalse(fn.called);
	},
	
	"test publish one argument": function() {
		var value1;
		Hub.subscribe("x/y", function(arg1) {
			value1 = arg1;
		});
		Hub.publish("x/y", "first");
		assertEquals("first", value1);
	},
	
	"test publish two arguments": function() {
		var value1, value2;
		Hub.subscribe("x/y", function(arg1, arg2) {
			value1 = arg1;
			value2 = arg2;
		});
		Hub.publish("x/y", "first", "second");
		assertEquals("first", value1);
		assertEquals("second", value2);
	},
	
	"test publish on topic with two subscribers": function() {
		var m = [];
		Hub.subscribe("x/y", function() {
			m.push("a");
		});
		Hub.subscribe("x/y", function() {
			m.push("b");
		});
		Hub.publish("x/y");
		// First b, then a since second overrides first:
		assertEquals("b,a", m.join());
	},
	
	"test publish to two subscribers via wildcard message": function() {
		var m = [];
		Hub.subscribe("x/a", function() {
			m.push("a");
		});
		Hub.subscribe("x/b", function() {
			m.push("b");
		});
		Hub.subscribe("y/c", function() {
			m.push("c");
		});
		Hub.publish("x/*");
		// b overrides a:
		assertEquals("b,a", m.join());
	},
	
	"test publish to two subscribers via wildcard namespace": function() {
		var m = [];
		Hub.subscribe("x/a", function() {
			m.push("a");
		});
		Hub.subscribe("y/a", function() {
			m.push("b");
		});
		Hub.subscribe("z/b", function() {
			m.push("c");
		});
		Hub.publish("*/a");
		// y overrides x:
		assertEquals("b,a", m.join());
	},
	
	"test publish to wildcard, subscribe another, publish again": function() {
		var fn1 = stubFn();
		Hub.subscribe("x/a", fn1);
		Hub.publish("x/*");
		assert(fn1.called);
		var fn2 = stubFn();
		Hub.subscribe("x/b", fn2);
		fn1.called = false;
		Hub.publish("x/*");
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test subscribe to wildcard": function() {
		var fn = stubFn();
		Hub.subscribe("x/*", fn);
		Hub.publish("y/a");
		assertFalse(fn.called);
		Hub.publish("x/a");
		assert(fn.called);
	},
	
	"test publish with placeholder in message": function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.publish("x/{0}", "y");
		assert(fn.called);
		fn.called = false;
		Hub.publish("x/{0.m}", {m: "y"});
		assert(fn.called);
	},
	
	"test subscribe publish subscribe same message": function() {
		var fn1 = stubFn();
		Hub.subscribe("x/y", fn1);
		Hub.publish("x/y");
		assert(fn1.called);
		fn1.called = false;
		var fn2 = stubFn();
		Hub.subscribe("x/y", fn2);
		Hub.publish("x/y");
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test subscribe publish subscribe same message w/ placeholder": function() {
		var fn1 = stubFn();
		Hub.subscribe("x/y", fn1);
		Hub.publish("x/{0}", "y");
		assert(fn1.called);
		fn1.called = false;
		var fn2 = stubFn();
		Hub.subscribe("x/y", fn2);
		Hub.publish("x/{0}", "y");
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test multicast publish and subscribe": function() {
		var fnx = stubFn();
		Hub.subscribe("x/*", fnx);
		Hub.publish("x/*");
		assert(fnx.called);
	},
	
	"test multicast subscriber invoked once": function() {
		var count = 0;
		var fn = function() {
			count++;
		};
		var fna = stubFn();
		var fnb = stubFn();
		Hub.subscribe("x/a", fna);
		Hub.subscribe("x/b", fnb);
		Hub.subscribe("x/*", fn);
		Hub.publish("x/*");
		assert(fna.called);
		assert(fnb.called);
		assertEquals(1, count);
	},
	
	"test multicast publish twice": function() {
		var count = 0;
		var fn = function() {
			count++;
		};
		Hub.subscribe("x/a", fn);
		Hub.publish("x/*");
		assertEquals(1, count);
		Hub.publish("x/*");
		assertEquals(2, count);
	}
	
});
