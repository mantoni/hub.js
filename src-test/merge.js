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
	
	testObjectMergeConflict: function() {
		var target = { x: "foo" };
		var source = { x: "bar" };
		var error = this.mergeError(target, source);
		assertEquals("foo", target.x);
		assertEquals("Cannot merge value {target} with {source}", error.message);
		assertEquals("foo", error.context.target);
		assertEquals("bar", error.context.source);
		assertEquals("[object String]", error.context.targetType);
		assertEquals("[object String]", error.context.sourceType);
	},
	
	testObjectReplaceMergeSame: function() {
		var error = null;
		Hub.subscribe("hub.error.warn", "util.merge", function(data) {
			error = data;
		});
		var o = Hub.util.merge({ x: "foo" }, { x: "foo" });
		assertEquals("foo", o.x);
		assertNull(error);
	},
	
	testMergeWithUndefined: function() {
		assertSame(true, Hub.util.merge(true, undefined));
		assertSame(true, Hub.util.merge(undefined, true));
		assertSame(false, Hub.util.merge(false, undefined));
		assertSame(false, Hub.util.merge(undefined, false));
		assertEquals("", Hub.util.merge("", undefined));
		assertEquals("", Hub.util.merge(undefined, ""));
	},
	
	testMergeWithNull: function() {
		assertSame(true, Hub.util.merge(true, null));
		assertSame(true, Hub.util.merge(null, true));
		assertSame(false, Hub.util.merge(false, null));
		assertSame(false, Hub.util.merge(null, false));
		assertEquals("", Hub.util.merge("", null));
		assertEquals("", Hub.util.merge(null, ""));
	},
	
	testBooleanMergeSame: function() {
		assertSame(true, Hub.util.merge(true, true));
		assertSame(false, Hub.util.merge(false, false));
	},
	
	testBooleanMergeConflict: function() {
		var error = this.mergeError(true, false);
		assertSame(true, error.context.target);
		assertSame(false, error.context.source);
		assertEquals("[object Boolean]", error.context.targetType);
		assertEquals("[object Boolean]", error.context.sourceType);
	},
	
	testStringMergeSame: function() {
		assertSame("", Hub.util.merge("", ""));
		assertSame("a", Hub.util.merge("a", "a"));
	},
	
	testStringMergeConflict: function() {
		var error = this.mergeError("", "a");
		assertSame("", error.context.target);
		assertSame("a", error.context.source);
		assertEquals("[object String]", error.context.targetType);
		assertEquals("[object String]", error.context.sourceType);
	},
	
	testMergeObjectWithArray: function() {
		var error = this.mergeError({}, []);
		assertEquals("Cannot merge type {targetType} with {sourceType}", error.message);
		assertEquals("[object Object]", error.context.targetType);
		assertEquals("[object Array]", error.context.sourceType);
	},
	
	mergeError: function(target, source) {
		var error = null;
		Hub.subscribe("hub.error.warn", "util.merge", function(data) {
			error = data;
		});
		Hub.util.merge(target, source);
		assertNotNull("error caught", error);
		return error;
	}

});