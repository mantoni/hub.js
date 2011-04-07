/*
 * Test cases for topic chains.
 */
TestCase("TopicChainTest", {
	
	setUp: function() {
		this.chain = Hub.util.sortedChain(Hub.config.topicComparator);
	},
	
	"test none aspect topics are called in reverse insert order": function() {
		var calls = [];
		this.chain.add(function() {
			calls.push("a");
		}, "topic/a");
		this.chain.add(function() {
			calls.push("b");
		}, "topic/b");
		this.chain();
		assertEquals("b,a", calls.join());
	},

	"test aspect is called before none aspect 1": function() {
		var calls = [];
		this.chain.add(function() {
			calls.push("a");
		}, "topic/*");
		this.chain.add(function() {
			calls.push("b");
		}, "topic/b");
		this.chain();
		assertEquals("a,b", calls.join());
	},

	"test aspect is called before none aspect 2": function() {
		var calls = [];
		this.chain.add(function() {
			calls.push("b");
		}, "topic/b");
		this.chain.add(function() {
			calls.push("a");
		}, "topic/*");
		this.chain();
		assertEquals("a,b", calls.join());
	},

	"test aspect sorting 1": function() {
		var calls = [];
		this.chain.add(function() {
			calls.push("a");
		}, "a/*");
		this.chain.add(function() {
			calls.push("b");
		}, "*/b");
		this.chain();
		assertEquals("b,a", calls.join());
	},

	"test aspect sorting 2": function() {
		var calls = [];
		this.chain.add(function() {
			calls.push("b");
		}, "*/b");
		this.chain.add(function() {
			calls.push("a");
		}, "a/*");
		this.chain();
		assertEquals("b,a", calls.join());
	}

});