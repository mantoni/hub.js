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
 * Test cases for Hub.forward.
 */
TestCase("ForwardTest", {
	
	tearDown: function () {
		Hub.reset();
	},
	
	"test simple forward short": function () {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward("a/b", "x/y");
		Hub.publish("a/b");
		assert(fn.called);
	},
	
	"test multi forward simple": function () {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward({
			"a/b": "x/y"
		});
		Hub.publish("a/b");
		assert(fn.called);
	},
	
	testMultiForwardComplex: function () {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward({
			"a/b": ["x/y"]
		});
		Hub.publish("a/b");
		assert(fn.called);
	}

});