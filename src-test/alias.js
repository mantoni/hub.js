/*
 * Test cases for Hub.alias.
 */
TestCase("alias", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * basic alias functionality.
	 */
	testSimpleAlias: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.alias("a", "b", "x", "y");
		Hub.publish("a", "b");
		assertTrue(called);
	}

});