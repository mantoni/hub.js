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
 * Test cases for hub.resolve.
 */
TestCase("ResolveTest", {
	
	"test function exists": function () {
		assertFunction(hub.resolve);
	},

	"test resolve undefined": function () {
		assertUndefined(hub.resolve({}, "foo"));
	},
	
	"test resolve index from array": function () {
		assertEquals("foo", hub.resolve(["foo"], "0"));
	},
	
	"test resolve property from object": function () {
		assertEquals("foo", hub.resolve({ x: "foo" }, "x"));
	},
	
	"test resolve property path from array": function () {
		assertEquals("foo", hub.resolve([{ x: "foo" }], "0.x"));
	},
	
	"test resolve property path from object": function () {
		assertEquals("foo", hub.resolve({ x: { y: "foo" } }, "x.y"));
	},
	
	"test resolve illegal path": function () {
		assertUndefined(hub.resolve({}, "x.y"));
	},
	
	"test resolve default value": function () {
		assertEquals("nothing 1", hub.resolve({}, "x", "nothing 1"));
		assertEquals("nothing 2", hub.resolve({}, "x.y", "nothing 2"));
	}
	
});

/*
 * Test cases for hub.substitute.
 */
TestCase("SubstituteTest", {
	
	"test function exists": function () {
		assertFunction(hub.substitute);
	},
	
	"test substitute nothing": function () {
		assertEquals("the quick brown fox",
			hub.substitute("the quick brown fox"));
	},
	
	"test substitute index from array": function () {
		assertEquals("hello index", hub.substitute("hello {0}", ["index"]));
	},
	
	"test substitute key from object": function () {
		assertEquals("hello value",
			hub.substitute("hello {key}", { key: "value" }));
	},
	
	"test substitute fallback": function () {
		assertEquals("hello fallback",
			hub.substitute("hello {0}", null, "fallback"));
		assertEquals("hello fallback",
			hub.substitute("hello {0}", {}, "fallback"));
	}
	
});

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
