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
 * Test cases for Hub.subscribe.
 */
TestCase("SubscribeTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testFunctionExists: function() {
		assertFunction(Hub.subscribe);
	},
	
	"test subscribe invocation": function() {
		var fn = stubFn();
		assertNoException(function() {
			Hub.subscribe("a", fn);
		});
		assertNoException(function() {
			Hub.subscribe("a/b", fn);
		});
		assertNoException(function() {
			Hub.subscribe("a/*", fn);
		});
		assertNoException(function() {
			Hub.subscribe("*/b", fn);
		});
		assertNoException(function() {
			Hub.subscribe("a.*/b", fn);
		});
		assertNoException(function() {
			Hub.subscribe("a/b.*", fn);
		});
		assertNoException(function() {
			Hub.subscribe("a.*/b.*", fn);
		});
		assertNoException(function() {
			Hub.subscribe("*.a/b", fn);
		});
		assertNoException(function() {
			Hub.subscribe("*.a/*.b", fn);
		});
		assertNoException(function() {
			Hub.subscribe("**/b", fn);
		});
		assertNoException(function() {
			Hub.subscribe("a/**", fn);
		});
	},
	
	"test subscribe throws if callback is not function": function() {
		assertException(function() {
			Hub.subscribe("x/y");
		});
		assertException(function() {
			Hub.subscribe("x/y", null);
		});
		assertException(function() {
			Hub.subscribe("x/y", true);
		});
		assertException(function() {
			Hub.subscribe("x/y", {});
		});
		assertException(function() {
			Hub.subscribe("x/y", []);
		});
	}
	
});