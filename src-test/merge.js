/*
 * Test cases for Hub.util.merge.
 */
TestCase("util.merge", {
	
	testEmptyObject: function() {
		var o = Hub.util.merge({}, {});
		assertEquals("[object Object]", Object.prototype.toString.call(o));
	},

	testEmptyArray: function() {
		var a = Hub.util.merge([], []);
		assertEquals("[object Array]", Object.prototype.toString.call(a));
	},
	
	testSimpleObjectMerge: function() {
		var o = Hub.util.merge({ foo: "foo" }, { bar: "bar" });
		assertEquals("foo", o.foo);
		assertEquals("bar", o.bar);
	},
	
	testSimpleArrayMerge: function() {
		var a = Hub.util.merge(["foo"], ["bar"]);
		assertEquals("foo,bar", a.join());
	},
	
	testObjectReplaceMergeConflict: function() {
		var target = { x: "foo" };
		var source = { x: "bar" };
		var error = null;
		Hub.subscribe("hub.error.warn", "util.merge", function(data) {
			error = data;
		});
		var o = Hub.util.merge(target, source);
		assertEquals("foo", o.x);
		assertNotNull(error);
		assertEquals("Cannot replace {property}={targetValue} with {sourceValue}", error.message);
		assertEquals(target, error.context.target);
		assertEquals(source, error.context.source);
		assertEquals("x", error.context.property);
		assertEquals("foo", error.context.targetValue);
		assertEquals("bar", error.context.sourceValue);
	},
	
	testObjectReplaceMergeSame: function() {
		var target = { x: "foo" };
		var source = { x: "foo" };
		var error = null;
		Hub.subscribe("hub.error.warn", "util.merge", function(data) {
			error = data;
		});
		var o = Hub.util.merge(target, source);
		assertEquals("foo", o.x);
		assertNull(error);
	}

	
});