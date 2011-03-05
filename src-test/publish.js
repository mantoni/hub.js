/*
 * Test cases for Hub.publish.
 */
TestCase("publish", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test function exists": function() {
		assertFunction(Hub.publish);
	},
	
	"test publish invocation with no listeners": function() {
		assertNoException(function() {
			Hub.publish("a");
		});
		assertNoException(function() {
			Hub.publish("a/b");
		});
		assertNoException(function() {
			Hub.publish("a/*");
		});
		assertNoException(function() {
			Hub.publish("*/b");
		});
		assertNoException(function() {
			Hub.publish("a.*/b");
		});
		assertNoException(function() {
			Hub.publish("a/b.*");
		});
		assertNoException(function() {
			Hub.publish("a.*/b.*");
		});
		assertNoException(function() {
			Hub.publish("*.a/b");
		});
		assertNoException(function() {
			Hub.publish("*.a/*.b");
		});
		assertNoException(function() {
			Hub.publish("**/b");
		});
		assertNoException(function() {
			Hub.publish("a/**");
		});
	},
	
	"test publish wildcards": function() {
		var fn = stubFn();
		Hub.peer("a.b", function() {
			return {
				"c.d": fn
			};
		});
		this.assertInvoked("a.b/c.*", fn);
		this.assertInvoked("a.b/c.**", fn);
		this.assertNotInvoked("a.b/*", fn);
		this.assertInvoked("a.b/**", fn);
		this.assertInvoked("a.*/c.d", fn);
		this.assertInvoked("a.**/c.d", fn);
		this.assertNotInvoked("*/c.d", fn);
		this.assertInvoked("**/c.d", fn);
	},
	
	assertInvoked: function(topic, fn) {
		Hub.publish(topic);
		assertTrue(topic, fn.called);
		fn.called = false;
	},
	
	assertNotInvoked: function(topic, fn) {
		Hub.publish(topic);
		assertFalse(topic, fn.called);
	},
	
	"test publish error": function() {
		Hub.subscribe("test/publish", function() {
			throw new Error("d'oh!");
		});
		var error = null;
		Hub.subscribe("hub.error/publish", function(data) {
			error = data;
		});
		Hub.publish("test/publish");
		assertNotNull(error);
		assertObject(error);
		assertEquals("Error in callback for topic \"test/publish\": d'oh!", error.toString());
		assertEquals("test/publish", error.context.topic);
		assertEquals("d'oh!", error.context.error);
	}

});