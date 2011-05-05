/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.chain.
 */
TestCase("ChainTest", {
	
	"test function exists": function() {
		assertFunction(Hub.chain);
	},
	
	"test function returns function": function() {
		assertFunction(Hub.chain());
	},
	
	"test chain implements add": function() {
		assertFunction(Hub.chain().add);
	},
	
	"test chain implements insert": function() {
		assertFunction(Hub.chain().insert);
	},
	
	"test chain call": function() {
		var calls = [];
		var f1 = function() {
			calls.push("f1");
		};
		var f2 = function() {
			calls.push("f2");
		};
		Hub.chain(f1, f2)();
		assertEquals("Called in argument order", "f1,f2", calls.join());
	},
	
	"test stop propagation": function() {
		var f = stubFn();
		Hub.chain(function() {
			Hub.stopPropagation();
		}, f)();
		assertFalse(f.called);
	},
	
	"test chain remove first of two": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.chain(f1, f2);
		chain.remove(f1);
		chain();
		assertFalse(f1.called);
		assertTrue(f2.called);
	},
	
	"test chain remove second of two": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.chain(f1, f2);
		chain.remove(f2);
		chain();
		assertTrue(f1.called);
		assertFalse(f2.called);
	},
	
	"test chain remove first of three": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var f3 = stubFn();
		var chain = Hub.chain(f1, f2, f3);
		chain.remove(f1);
		chain();
		assertFalse(f1.called);
		assertTrue(f2.called);
		assertTrue(f3.called);
	},
	
	"test chain remove second of three": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var f3 = stubFn();
		var chain = Hub.chain(f1, f2, f3);
		chain.remove(f2);
		chain();
		assertTrue(f1.called);
		assertFalse(f2.called);
		assertTrue(f3.called);
	},
	
	"test chain remove third of three": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var f3 = stubFn();
		var chain = Hub.chain(f1, f2, f3);
		chain.remove(f3);
		chain();
		assertTrue(f1.called);
		assertTrue(f2.called);
		assertFalse(f3.called);
	},
	
	"test chain modification while iterating": function() {
		var calls = 0;
		var sf = stubFn();
		var chain = Hub.chain();
		chain.add(function() {
			calls++;
			chain.add(sf);
		});
		chain();
		assertEquals(1, calls);
		assertFalse(sf.called);
	},
	
	"test scope is retained": function() {
		var fn = stubFn();
		var chain = Hub.chain();
		chain.add(fn);
		var object = {};
		chain.call(object);
		assertSame(object, fn.scope);
	}
	
});