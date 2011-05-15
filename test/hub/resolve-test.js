/*jslint undef: true, white: true*/
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
 * Test cases for Hub.resolve.
 */
TestCase("ResolveTest", {
	
	"test function exists": function () {
		assertFunction(Hub.resolve);
	},

	"test resolve undefined": function () {
		assertUndefined(Hub.resolve({}, "foo"));
	},
	
	"test resolve index from array": function () {
		assertEquals("foo", Hub.resolve(["foo"], "0"));
	},
	
	"test resolve property from object": function () {
		assertEquals("foo", Hub.resolve({ x: "foo" }, "x"));
	},
	
	"test resolve property path from array": function () {
		assertEquals("foo", Hub.resolve([{ x: "foo" }], "0.x"));
	},
	
	"test resolve property path from object": function () {
		assertEquals("foo", Hub.resolve({ x: { y: "foo" } }, "x.y"));
	},
	
	"test resolve illegal path": function () {
		assertUndefined(Hub.resolve({}, "x.y"));
	},
	
	"test resolve default value": function () {
		assertEquals("nothing 1", Hub.resolve({}, "x", "nothing 1"));
		assertEquals("nothing 2", Hub.resolve({}, "x.y", "nothing 2"));
	}
	
});
