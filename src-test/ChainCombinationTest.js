/*
 * Test cases for combined chain types.
 */
TestCase("ChainCombinationTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test multiChain.add passed property on to child": function() {
		var fn = stubFn();
		var chain = Hub.multiChain(stubFn(0), [{
			add: fn
		}]);
		chain.add(Hub.noop, "test");
		assert(fn.called);
		assertEquals({ 0: Hub.noop, 1: "test"}, fn.args);
	}
	
});