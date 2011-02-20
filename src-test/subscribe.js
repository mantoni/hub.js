/*
 * Test cases for Hub.subscribe.
 */
TestCase("subscribe", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * basic subscribe functionality.
	 */
	testSimpleSubscribe: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.publish("x", "y");
		assertTrue(called);
	},
	
	/*
	 * ensure a peer can be defined after an existing subscription
	 * and both get mixed and then invoked in the correct order.
	 */
	testSubscribeThenAddPeer: function() {
		var chain = [];
		Hub.subscribe("a", "b", function() {
			chain.push("subscribe");
		});
		Hub.peer("a", function() {
			return {
				"b": function() {
					chain.push("node");
				}
			};
		});
		Hub.publish("a", "b");
		// node first, because it was added last.
		assertEquals("node,subscribe", chain.join());
	}

});