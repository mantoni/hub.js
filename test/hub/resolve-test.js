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
