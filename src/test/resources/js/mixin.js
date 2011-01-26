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
	testMixinCallOrder: function() {
		var chain = [];
		Hub.node("parent",
			function() {
				return {
					"test": function() {
						chain.push("parent");
					}
				};
			}
		);
		Hub.node("child",
			{
				is: "parent"
			},
			function() {
				return {
					"test": function() {
						chain.push("child");
					}
				};
			}
		);
		// child is called first, then the "super" implementation.
		Hub.publish("child", "test");
		assertEquals("child,parent", chain.join());
	},
	
	/*
	 * Hub.stopPropagation() stops the propagation of the message
	 * in the current chain. So in this test case, the parents "test"
	 * is not invoked.
	 */
	testStopPropagation: function() {
		var chain = [];
		Hub.node("parent",
			function() {
				return {
					"test": function() {
						chain.push("parent");
					}
				};
			}
		);
		Hub.node("child",
			{
				is: "parent"
			},
			function() {
				return {
					"test": function() {
						chain.push("child");
						Hub.stopPropagation();
					}
				};
			}
		);
		Hub.publish("child", "test");
		assertEquals("child", chain.join());
	},
	
	/*
	 * Hub.propagate() explicitly propagates the message to the
	 * next function in the call chain. This also means that the
	 * next function is not implicitly invoked afterwards anymore.
	 */
	testPropagate: function() {
		var chain = [];
		Hub.node("parent",
			function() {
				return {
					"test": function() {
						chain.push("parent");
					}
				};
			}
		);
		Hub.node("child",
			{
				is: "parent"
			},
			function() {
				return {
					"test": function() {
						Hub.propagate();
						chain.push("child");
					}
				};
			}
		);
		// explicit "super" invocation changes call order here.
		Hub.publish("child", "test");
		assertEquals("parent,child", chain.join());
	}

});