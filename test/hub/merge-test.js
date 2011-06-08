/*jslint undef: true, white: true*/
/*globals hub sinon TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.merge.
 */
(function () {
	
	function mergeError(target, source) {
		var error = null;
		try {
			hub.merge(target, source);
		} catch (e) {
			error = e;
		}
		
		assertNotNull(error);
		assertObject(error);
		assertEquals("validation", error.type);
		
		return error;
	}

	TestCase("MergeTest", {

		"test empty object": function () {
			var o = hub.merge({}, {});
			
			assertEquals("[object Object]", Object.prototype.toString.call(o));
		},

		"test empty array": function () {
			var a = hub.merge([], []);
			
			assertEquals("[object Array]", Object.prototype.toString.call(a));
		},

		"test should merge object properties": function () {
			var o = hub.merge({ foo: "foo" }, { bar: "bar" });
			
			assertEquals("foo", o.foo);
			assertEquals("bar", o.bar);
		},

		"test should concatenate arrays": function () {
			var a = hub.merge(["foo"], ["bar"]);
			
			assertEquals("foo,bar", a.join());
		},

		"test should throw for different string values": function () {
			var target = { x: "foo" };
			var source = { x: "bar" };
			
			var error = mergeError(target, source);
			
			assertEquals("foo", target.x);
			assertEquals("Cannot merge value foo with bar", error.toString());
			assertEquals("foo", error.context.target);
			assertEquals("bar", error.context.source);
			assertEquals("[object String]", error.context.targetType);
			assertEquals("[object String]", error.context.sourceType);
		},

		"test should not throw for same string values": function () {
			var o;
			assertNoException(function () {
				o = hub.merge({ x: "foo" }, { x: "foo" });
			});
			
			assertEquals("foo", o.x);
		},

		"test should retain value if merged with undefined": function () {
			assertSame(true, hub.merge(true, undefined));
			assertSame(true, hub.merge(undefined, true));
			assertSame(false, hub.merge(false, undefined));
			assertSame(false, hub.merge(undefined, false));
			assertEquals("", hub.merge("", undefined));
			assertEquals("", hub.merge(undefined, ""));
		},

		"test should retain value if merged with null": function () {
			assertSame(true, hub.merge(true, null));
			assertSame(true, hub.merge(null, true));
			assertSame(false, hub.merge(false, null));
			assertSame(false, hub.merge(null, false));
			assertEquals("", hub.merge("", null));
			assertEquals("", hub.merge(null, ""));
		},

		"test should merge true and true": function () {
			assertSame(true, hub.merge(true, true));
		},

		"test should merge false and false": function () {
			assertSame(false, hub.merge(false, false));
		},

		"test should fail on true and false": function () {
			var error = mergeError(true, false);
			
			assertSame(true, error.context.target);
			assertSame(false, error.context.source);
			assertEquals("[object Boolean]", error.context.targetType);
			assertEquals("[object Boolean]", error.context.sourceType);
		},

		"test should merge equal strings": function () {
			assertSame("", hub.merge("", ""));
			assertSame("a", hub.merge("a", "a"));
		},

		"test should fail on different strings": function () {
			var error = mergeError("", "a");
			
			assertSame("", error.context.target);
			assertSame("a", error.context.source);
			assertEquals("[object String]", error.context.targetType);
			assertEquals("[object String]", error.context.sourceType);
		},

		"test should fail on object and array": function () {
			var error = mergeError({}, []);
			
			assertEquals("validation", error.type);
			assertEquals("Cannot merge type [object Object] with [object Array]",
				error.toString());
			assertEquals("[object Object]", error.context.targetType);
			assertEquals("[object Array]", error.context.sourceType);
		}

	});

}());