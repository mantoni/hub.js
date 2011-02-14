/*
 * Test cases for Hub.peer.
 */
TestCase("peer", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * assert defining a node twice fails.
	 */
	testDefineTwice: function() {
		Hub.peer("definedTwice", function() {
			return {};
		});
		try {
			Hub.peer("definedTwice", function() {});
		} catch(e) {
			assertEquals("Hub - peer already defined: definedTwice", e.message);
			return;
		}
		fail("Exception expected");
	},
	
	/*
	 * assert a simple node definition with one listener works. 
	 */
	testSimple: function() {
		var called = false;
		Hub.peer("simple", function() {
			return {
				"message": function() {
					called = true;
				}
			};
		});
		Hub.publish("simple", "message");
		assertTrue(called);
	},
	
	/*
	 * assert dot separated namespaces can be used for peer identifiers
	 * as well as listeners.
	 */
	testDotSeparatedNamespaces: function() {
		var called = false;
		Hub.peer("a.b", function() {
			return {
				"c.d": function() {
					called = true;
				}
			};
		});
		Hub.publish("a.b", "c");
		assertFalse(called);
		Hub.publish("a.b", "c.d");
		assertTrue(called);
	}

});