/*
 * Test cases for Hub.publish.
 */
TestCase("publish", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * assert publishing a namespace that is not picked up by anybody does not fail.
	 */
	testPublishUnknown: function() {
		Hub.publish("unknown", "message"); // should not throw an error.
		assertTrue(true); // Just to have at least one assert.
	},
	
	/*
	 * assert publishing a topic with more than one subscriber works and is
	 * processed in the right order.
	 */
	testPublishMulticast: function() {
		var chain = [];
		Hub.node("a.b", function() {
			return {
				"m": function() {
					chain.push("x");
				}
			};
		});
		Hub.node("a.c", function() {
			return {
				"m": function() {
					chain.push("y");
				}
			};
		});
		Hub.publish("a.*", "m");
		// The nodes will be called in the order as they are defined.
		assertEquals("xy", chain.join(""));
	},
	
	testPublishWildcard: function() {
		var count = 0;
		Hub.node("a.b", function() {
			return {
				"c.d": function() {
					count++;
				}
			};
		});
		Hub.publish("a.b", "c.*");
		assertEquals("a.b : c.*", 1, count);
		Hub.publish("a.b", "c.**");
		assertEquals("a.b : c.**", 2, count);
		Hub.publish("a.b", "*");
		assertEquals("a.b : *", 2, count); // no match
		Hub.publish("a.b", "**");
		assertEquals("a.b : **", 3, count);
		
		Hub.publish("a.*", "c.d");
		assertEquals("a.* : c.d", 4, count);
		Hub.publish("a.**", "c.d");
		assertEquals("a.** : c.d", 5, count);
		Hub.publish("*", "c.d");
		assertEquals("* : c.d", 5, count); // no match
		Hub.publish("**", "c.d");
		assertEquals("** : c.d", 6, count);
	}

});