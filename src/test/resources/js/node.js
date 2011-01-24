/*
 * Test cases for Hub.node.
 */
TestCase("node", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * assert defining a node twice fails.
	 */
	testDefineTwice: function() {
		Hub.node("definedTwice", function() {
			return {};
		});
		try {
			Hub.node("definedTwice", function() {});
		} catch(e) {
			assertEquals("Hub - node already defined: definedTwice", e.message);
			return;
		}
		fail("Exception expected");
	},
	
	/*
	 * assert a simple node definition with one listener works. 
	 */
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
		assertTrue(called);
	},
	
	/*
	 * assert dot separated namespaces can be used for node names
	 * as well as listeners.
	 */
	testDotSeparatedNamespaces: function() {
		var called = false;
		Hub.node("a.b", function() {
			return {
				"c.d": function() {
					called = true;
				}
			};
		});
		Hub.publish("a.b.c");
		assertFalse(called);
		Hub.publish("a.b.c.d");
		assertTrue(called);
	}

});