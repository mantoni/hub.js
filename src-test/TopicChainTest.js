/*
 * Test cases for Hub.util.topicChain.
 */
TestCase("TopicChainTest", {
	
	"test function exists": function() {
		assertFunction(Hub.util.topicChain);
	},
	
	"test none aspect topics are called in reverse insert order": function() {
		var chain = Hub.util.topicChain();
		var calls = [];
		chain.add(function() {
			calls.push("a");
		}, "topic/a");
		chain.add(function() {
			calls.push("b");
		}, "topic/b");
		chain();
		assertEquals("b,a", calls.join());
	},

	"test aspect is called before none aspect 1": function() {
		var chain = Hub.util.topicChain();
		var calls = [];
		chain.add(function() {
			calls.push("a");
		}, "topic/*");
		chain.add(function() {
			calls.push("b");
		}, "topic/b");
		chain();
		assertEquals("a,b", calls.join());
	},

	"test aspect is called before none aspect 2": function() {
		var chain = Hub.util.topicChain();
		var calls = [];
		chain.add(function() {
			calls.push("b");
		}, "topic/b");
		chain.add(function() {
			calls.push("a");
		}, "topic/*");
		chain();
		assertEquals("a,b", calls.join());
	},

	"test aspect sorting 1": function() {
		var chain = Hub.util.topicChain();
		var calls = [];
		chain.add(function() {
			calls.push("a");
		}, "a/*");
		chain.add(function() {
			calls.push("b");
		}, "*/b");
		chain();
		assertEquals("b,a", calls.join());
	},

	"test aspect sorting 2": function() {
		var chain = Hub.util.topicChain();
		var calls = [];
		chain.add(function() {
			calls.push("b");
		}, "*/b");
		chain.add(function() {
			calls.push("a");
		}, "a/*");
		chain();
		assertEquals("b,a", calls.join());
	}

});