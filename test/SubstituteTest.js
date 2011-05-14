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
 * Test cases for Hub.substitute.
 */
TestCase("SubstituteTest", {
	
	"test function exists": function() {
		assertFunction(Hub.substitute);
	},
	
	"test substitute nothing": function() {
		assertEquals("the quick brown fox",
			Hub.substitute("the quick brown fox"));
	},
	
	"test substitute index from array": function() {
		assertEquals("hello index", Hub.substitute("hello {0}", ["index"]));
	},
	
	"test substitute key from object": function() {
		assertEquals("hello value",
			Hub.substitute("hello {key}", { key: "value" }));
	},
	
	"test substitute fallback": function() {
		assertEquals("hello fallback",
			Hub.substitute("hello {0}", null, "fallback"));
		assertEquals("hello fallback",
			Hub.substitute("hello {0}", {}, "fallback"));
	}
	
});
