/*jslint undef: true, white: true*/
/*globals hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.propagate.
 */
TestCase("PropagateTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test propagate explicitly": function () {
		var calls = [];
		hub.chain(function () {
			hub.propagate();
			calls.push("a");
		}, function () {
			calls.push("b");
		})();
		assertEquals("b,a", calls.join());
	},
	
	"test implicit argument propagation": function () {
		var calls = [];
		hub.chain(function (a, b) {
			calls.push("x", a, b);
		}, function (a, b) {
			calls.push("y", a, b);
		})("a", "b");
		assertEquals("x,a,b,y,a,b", calls.join());
	},
	
	"test explicit argument propagation": function () {
		var calls = [];
		hub.chain(function (a, b) {
			hub.propagate();
			calls.push("x", a, b);
		}, function (a, b) {
			calls.push("y", a, b);
		})("a", "b");
		assertEquals("y,a,b,x,a,b", calls.join());
	},
	
	"test override result": function () {
		assertEquals(["b", "c"], hub.chain(function () {
			return ["a"];
		}, function () {
			hub.propagate(["b"]);
		}, function () {
			return ["c"];
		})());
	}

});