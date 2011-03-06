/*
 * Test cases for Hub.util.chain.
 */
TestCase("util_chain", {
	
	"test function exists": function() {
		assertFunction(Hub.util.chain);
	},

	testChainCall: function() {
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
	
	testStopPropagation: function() {
		var f = stubFn();
		Hub.util.chain(function() {
			Hub.stopPropagation();
		}, f)();
		assertFalse(f.called);
	},
	
	testChainRemoveFirstOfTwo: function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.util.chain(f1, f2);
		assertFunction(chain.remove);
		chain = chain.remove(f1);
		assertFunction(chain);
		assertUndefined(chain.remove);
		chain();
		assertFalse(f1.called);
		assertTrue(f2.called);
	},
	
	testChainRemoveSecondOfTwo: function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.util.chain(f1, f2);
		assertFunction(chain.remove);
		chain = chain.remove(f2);
		assertFunction(chain);
		assertUndefined(chain.remove);
		chain();
		assertTrue(f1.called);
		assertFalse(f2.called);
	},
	
	testChainRemoveFirstOfThree: function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var f3 = stubFn();
		var chain = Hub.util.chain(f1, f2, f3);
		assertFunction(chain.remove);
		chain = chain.remove(f1);
		assertFunction(chain);
		assertFunction(chain.remove);
		chain();
		assertFalse(f1.called);
		assertTrue(f2.called);
		assertTrue(f3.called);
	},
	
	testChainRemoveSecondOfThree: function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var f3 = stubFn();
		var chain = Hub.util.chain(f1, f2, f3);
		assertFunction(chain.remove);
		chain = chain.remove(f2);
		assertFunction(chain);
		assertFunction(chain.remove);
		chain();
		assertTrue(f1.called);
		assertFalse(f2.called);
		assertTrue(f3.called);
	},
	
	testChainRemoveThirdOfThree: function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var f3 = stubFn();
		var chain = Hub.util.chain(f1, f2, f3);
		assertFunction(chain.remove);
		chain = chain.remove(f3);
		assertFunction(chain);
		assertFunction(chain.remove);
		chain();
		assertTrue(f1.called);
		assertTrue(f2.called);
		assertFalse(f3.called);
	},
	
	testChainRemoveFirstNoReassign: function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.util.chain(f1, f2);
		chain.remove(f1);
		chain();
		assertFalse(f1.called);
		assertTrue(f2.called);
	},
	
	testChainRemoveSecondNoReassign: function() {
		var f1 = stubFn();
		var f2 = stubFn();
		var chain = Hub.util.chain(f1, f2);
		chain.remove(f2);
		chain();
		assertTrue(f1.called);
		assertFalse(f2.called);
	}
	
});