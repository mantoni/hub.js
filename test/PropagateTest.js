/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.propagate.
 */
TestCase("PropagateTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test propagate explicitly": function() {
		var calls = [];
		Hub.chain(function() {
			Hub.propagate();
			calls.push("a");
		}, function() {
			calls.push("b");
		})();
		assertEquals("b,a", calls.join());
	},
	
	"test implicit argument propagation": function() {
		var calls = [];
		Hub.chain(function(a, b) {
			calls.push("x", a, b);
		}, function(a, b) {
			calls.push("y", a, b);
		})("a", "b");
		assertEquals("x,a,b,y,a,b", calls.join());
	},
	
	"test explcit argument propagation": function() {
		var calls = [];
		Hub.chain(function(a, b) {
			Hub.propagate();
			calls.push("x", a, b);
		}, function(a, b) {
			calls.push("y", a, b);
		})("a", "b");
		assertEquals("y,a,b,x,a,b", calls.join());
	}

});