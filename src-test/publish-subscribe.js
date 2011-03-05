/*
 * Test cases for publish and subscribe.
 */
TestCase("publish_subscribe", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test publish calls subscriber with same topic": function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.publish("x/y");
		assertTrue(fn.called);
	},
	
	"test publish does not call subscriber with different topic": function() {
		var fn = stubFn();
		Hub.subscribe("a/b", fn);
		Hub.publish("x/y");
		assertUndefined(fn.called);
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
		// Called in definition order:
		assertEquals("a,b", m.join());
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
		// Called in definition order:
		assertEquals("a,b", m.join());
	},
	
	"test publish with placeholder in message": function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.publish("x/{0}", "y");
		assertTrue(fn.called);
		fn.called = false;
		Hub.publish("x/{0.m}", {m: "y"});
		assertTrue(fn.called);
	},
	
	"test subscribe publish subscribe same message": function() {
		var fn1 = stubFn();
		Hub.subscribe("x/y", fn1);
		Hub.publish("x/y");
		assertTrue(fn1.called);
		fn1.called = false;
		var fn2 = stubFn();
		Hub.subscribe("x/y", fn2);
		Hub.publish("x/y");
		assertTrue(fn1.called);
		assertTrue(fn2.called);
	},
	
	"test subscribe publish subscribe same message w/ placeholder": function() {
		var fn1 = stubFn();
		Hub.subscribe("x/y", fn1);
		Hub.publish("x/{0}", "y");
		assertTrue(fn1.called);
		fn1.called = false;
		var fn2 = stubFn();
		Hub.subscribe("x/y", fn2);
		Hub.publish("x/{0}", "y");
		assertTrue(fn1.called);
		assertTrue(fn2.called);
	}
	
	// publish_subscribe
	
});
