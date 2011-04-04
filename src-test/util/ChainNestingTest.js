/*
 * Test cases for nested chains.
 */
TestCase("ChainNestingTest", {
	
	"test nested chain function is called": function() {
		var f = stubFn();
		var ca = Hub.util.chain(f);
		var cb = Hub.util.chain(ca);
		cb();
		assert(f.called);
	},
	
	"test nested chain function aborts parent": function() {
		var ca = Hub.util.chain(function() {
			Hub.stopPropagation();
		});
		var f = stubFn();
		var cb = Hub.util.chain(ca, f);
		cb();
		assertFalse(f.called);
	},
	
	"test nested chain function propagates to parent": function() {
		var f = stubFn();
		var ca = Hub.util.chain(function() {
			Hub.propagate();
			assert(f.called);
		});
		var cb = Hub.util.chain(ca, f);
		cb();
	}
	
});
