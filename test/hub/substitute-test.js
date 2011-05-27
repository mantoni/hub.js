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
