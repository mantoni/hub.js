/*
 * Test cases for mixins.
 */
TestCase("mixin", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * in a parent-child relationship the child gets called
	 * first and the parent second. This follows the idea of
	 * overwriting.
	 */
	"test mixin call order": function() {
		var chain = [];
		Hub.peer("parent", {
			"test": function() {
				chain.push("parent");
			}
		});
		Hub.peer("child", "parent", {
			"test": function() {
				chain.push("child");
			}
		});
		// child is called first, then the "super" implementation.
		Hub.publish("child/test");
		assertEquals("child,parent", chain.join());
	},
	
	/*
	 * Hub.stopPropagation() stops the propagation of the message
	 * in the current chain. So in this test case, the parents "test"
	 * is not invoked.
	 */
	"test stop propagation": function() {
		var chain = [];
		Hub.peer("parent", {
			"test": function() {
				chain.push("parent");
			}
		});
		Hub.peer("child", "parent", {
			"test": function() {
				chain.push("child");
				Hub.stopPropagation();
			}
		});
		Hub.publish("child/test");
		assertEquals("child", chain.join());
	},
	
	/*
	 * Hub.propagate() explicitly propagates the message to the
	 * next function in the call chain. This also means that the
	 * next function is not implicitly invoked afterwards anymore.
	 */
	"test propagate": function() {
		var chain = [];
		Hub.peer("parent", {
			"test": function() {
				chain.push("parent");
			}
		});
		Hub.peer("child", "parent", {
			"test": function() {
				Hub.propagate();
				chain.push("child");
			}
		});
		// explicit "super" invocation changes call order here.
		Hub.publish("child/test");
		assertEquals("parent,child", chain.join());
	}

});