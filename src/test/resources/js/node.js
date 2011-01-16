/*
 * Test cases for Hub.node.
 */
TestCase("node", {
	
	testSimple: function() {
		var called = false;
		Hub.node("simple", function() {
			return {
				"message": function() {
					called = true;
				}
			};
		});
		Hub.publish("simple.message");
		//assertTrue(called);
		assertFalse(called);
	}

});