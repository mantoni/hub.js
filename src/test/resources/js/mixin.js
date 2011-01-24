/*
 * Test cases for mixins.
 */
TestCase("mixin", {
	
	tearDown: function() {
		Hub.reset();
	},
	
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
		Hub.publish("child.test");
		assertEquals("child,parent", chain.join());
	},
	
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
		Hub.publish("child.test");
		assertEquals("child", chain.join());
	},
	
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
		Hub.publish("child.test");
		assertEquals("parent,child", chain.join());
	}

});