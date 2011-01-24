/*
 * Test cases for Hub.publish.
 */
TestCase("publish", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * assert publishing a topic that is not picked up by anybody does not fail.
	 */
	testPublishUnknown: function() {
		Hub.publish("unknown.node"); // should not throw an error.
		assertTrue(true); // Just to have at least one assert.
	},
	
	/*
	 * assert publishing a topic with more than one subscriber works and is
	 * processed in the right order.
	 */
	testPublishMulticast: function() {
		var chain = [];
		Hub.node("a", function() {
			return {
				"b.c": function() {
					chain.push("x");
				}
			};
		});
		Hub.node("a.b", function() {
			return {
				"c": function() {
					chain.push("y");
				}
			};
		});
		Hub.publish("a.b.c");
		// Assert y is added first, then x because "a.b" is more specific than "a".
		assertEquals("yx", chain.join(""));
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
		Hub.publish("a.b.c.*");
		assertEquals("a.b.c.*", 1, count);
		Hub.publish("a.b.c.**");
		assertEquals("a.b.c.**", 2, count);
		Hub.publish("a.b.*");
		assertEquals("a.b.*", 2, count);
		Hub.publish("a.b.**");
		assertEquals("a.b.**", 3, count);
		Hub.publish("a.*");
		assertEquals("a.*", 3, count);
		
		// publish is not smart enough for a.** yet.
		//Hub.publish("a.**");
		//assertEquals("a.**", 4, count);
		//Hub.publish("*");
		//assertEquals("*", 4, count);
		//Hub.publish("**");
		//assertEquals("**", 5, count);
	}

});