/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for nested chains.
 */
TestCase("ChainNestingTest", {
	
	"test nested chain function is called": function() {
		var f = stubFn();
		var ca = Hub.chain(f);
		var cb = Hub.chain(ca);
		cb();
		assert(f.called);
	},
	
	"test nested chain function aborts parent": function() {
		var ca = Hub.chain(function() {
			Hub.stopPropagation();
		});
		var f = stubFn();
		var cb = Hub.chain(ca, f);
		cb();
		assertFalse(f.called);
	},
	
	"test nested chain function propagates to parent": function() {
		var f = stubFn();
		var ca = Hub.chain(function() {
			Hub.propagate();
			assert(f.called);
		});
		var cb = Hub.chain(ca, f);
		cb();
	},
	
	"test nested chain result merge": function() {
		var c1 = Hub.chain(function() {
			return [1];
		});
		var c2 = Hub.chain(function() {
			return [2];
		});
		assertEquals([1, 2], Hub.chain(c1, c2)());
	},
	
	"test nested chain receives arguments": function() {
		var args = [];
		var c1 = Hub.chain(function(a) {
			args.push(a);
		});
		var c2 = Hub.chain(function(a) {
			args.push(a);
		});
		Hub.chain(c1, c2)("x");
		assertEquals(["x", "x"], args);
	}
	
});
