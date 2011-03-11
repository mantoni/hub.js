/*
 * Test cases for Hub.util.chain.
 */
TestCase("util_chain", {
	
	"test function exists": function() {
		assertFunction(Hub.util.chain);
	},

	"test chain call": function() {
		var calls = [];
		var f1 = function() {
			calls.push("f1");
		};
		var f2 = function() {
			calls.push("f2");
		};
		var chain = Hub.util.chain(f1, f2);
		assertFunction(chain);
		chain();
		assertEquals("Called in argument order", "f1,f2", calls.join());
	},
	
	"test stop propagation": function() {
		var f = stubFn();
		Hub.util.chain(function() {
			Hub.stopPropagation();
		}, f)();
		assertFalse(f.called);
	},
	
	"test chain remove first of two": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.util.chain(f1, f2);
		chain.remove(f1);
		chain();
		assertFalse(f1.called);
		assertTrue(f2.called);
	},
	
	"test chain remove second of two": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.util.chain(f1, f2);
		chain.remove(f2);
		chain();
		assertTrue(f1.called);
		assertFalse(f2.called);
	},
	
	"test chain remove first of three": function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var f3 = stubFn();
		var chain = Hub.util.chain(f1, f2, f3);
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
		var chain = Hub.util.chain(f1, f2, f3);
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
		var chain = Hub.util.chain(f1, f2, f3);
		chain.remove(f3);
		chain();
		assertTrue(f1.called);
		assertTrue(f2.called);
		assertFalse(f3.called);
	}
	
});