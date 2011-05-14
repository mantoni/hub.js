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
 * Test cases for Hub.merge.
 */
TestCase("MergeTest", {
	
	testEmptyObject: function() {
		var o = Hub.merge({}, {});
		assertEquals("[object Object]", Object.prototype.toString.call(o));
	},

	testEmptyArray: function() {
		var a = Hub.merge([], []);
		assertEquals("[object Array]", Object.prototype.toString.call(a));
	},
	
	testSimpleObjectMerge: function() {
		var o = Hub.merge({ foo: "foo" }, { bar: "bar" });
		assertEquals("foo", o.foo);
		assertEquals("bar", o.bar);
	},
	
	testSimpleArrayMerge: function() {
		var a = Hub.merge(["foo"], ["bar"]);
		assertEquals("foo,bar", a.join());
	},
	
	testObjectMergeConflict: function() {
		var target = { x: "foo" };
		var source = { x: "bar" };
		var error = this.mergeError(target, source);
		assertEquals("foo", target.x);
		assertEquals("Cannot merge value foo with bar", error.toString());
		assertEquals("foo", error.context.target);
		assertEquals("bar", error.context.source);
		assertEquals("[object String]", error.context.targetType);
		assertEquals("[object String]", error.context.sourceType);
	},
	
	testObjectReplaceMergeSame: function() {
		var error = null;
		Hub.subscribe("hub.error.warn/util.merge", function(data) {
			error = data;
		});
		var o = Hub.merge({ x: "foo" }, { x: "foo" });
		assertEquals("foo", o.x);
		assertNull(error);
	},
	
	testMergeWithUndefined: function() {
		assertSame(true, Hub.merge(true, undefined));
		assertSame(true, Hub.merge(undefined, true));
		assertSame(false, Hub.merge(false, undefined));
		assertSame(false, Hub.merge(undefined, false));
		assertEquals("", Hub.merge("", undefined));
		assertEquals("", Hub.merge(undefined, ""));
	},
	
	testMergeWithNull: function() {
		assertSame(true, Hub.merge(true, null));
		assertSame(true, Hub.merge(null, true));
		assertSame(false, Hub.merge(false, null));
		assertSame(false, Hub.merge(null, false));
		assertEquals("", Hub.merge("", null));
		assertEquals("", Hub.merge(null, ""));
	},
	
	testBooleanMergeSame: function() {
		assertSame(true, Hub.merge(true, true));
		assertSame(false, Hub.merge(false, false));
	},
	
	testBooleanMergeConflict: function() {
		var error = this.mergeError(true, false);
		assertSame(true, error.context.target);
		assertSame(false, error.context.source);
		assertEquals("[object Boolean]", error.context.targetType);
		assertEquals("[object Boolean]", error.context.sourceType);
	},
	
	testStringMergeSame: function() {
		assertSame("", Hub.merge("", ""));
		assertSame("a", Hub.merge("a", "a"));
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
		assertEquals("validation", error.type);
		assertEquals("Cannot merge type [object Object] with [object Array]",
			error.toString());
		assertEquals("[object Object]", error.context.targetType);
		assertEquals("[object Array]", error.context.sourceType);
	},
	
	mergeError: function(target, source) {
		var error = null;
		try {
			Hub.merge(target, source);
		}
		catch(e) {
			error = e;
		}
		assertNotNull(error);
		assertObject(error);
		assertEquals("validation", error.type);
		return error;
	}

});