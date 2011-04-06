/*
 * Test cases for sorted chains.
 */
TestCase("ChainSortingTest", {
	
	"test sortedChain exists": function() {
		assertFunction(Hub.util.sortedChain);
	},
	
	"test sortedChain returns function": function() {
		assertFunction(Hub.util.sortedChain(Hub.noop));
	},
	
	"test sortedChain requires comparator": function() {
		assertException(function() {
			Hub.util.sortedChain();
		});
	},
	
	"test sortedChain implements add": function() {
		assertFunction(Hub.util.sortedChain(Hub.noop).add);
	},
	
	"test sortedChain implements insert": function() {
		assertFunction(Hub.util.sortedChain(Hub.noop).insert);
	},
	
	"test add requires second argument": function() {
		var chain = Hub.util.sortedChain(Hub.noop);
		assertException(function() {
			chain.add(Hub.noop);
		});
	},
	
	"test comparator function not invoked on first add": function() {
		var f = stubFn();
		Hub.util.sortedChain(f).add(Hub.noop, "x");
		assertFalse(f.called);
	},
	
	"test comparator function invoked on second add": function() {
		var f = stubFn();
		this.createSimpleChain(f);
		assert(f.called);
	},
	
	"test comparator returning natural ordering": function() {
		var chain = this.createSimpleChain(function(x, y) {
			return x < y ? -1 : 1;
		});
		assertEquals("a", chain.get(0)());
		assertEquals("b", chain.get(1)());
	},
	
	"test comparator returning natural reverse ordering": function() {
		var chain = this.createSimpleChain(function(x, y) {
			return x < y ? 1 : -1;
		});
		assertEquals("b", chain.get(0)());
		assertEquals("a", chain.get(1)());
	},
	
	createSimpleChain: function(comparator) {
		var chain = Hub.util.sortedChain(comparator);
		return chain.add(function() {
			return "b";
		}, "b").add(function() {
			return "a";
		}, "a");
	}
	
});
