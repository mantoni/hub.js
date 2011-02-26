/*
 * Test cases for Hub.publish timeouts.
 */
AsyncTestCase("publish-timeout", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testSimpleTimeout: function(queue) {
		Hub.subscribe("a/b", function() {
			Hub.promise();
		});
		queue.call(function(pool) {
			var time = new Date().getTime();
			Hub.publish("a", "b", null, 50).then(function() {
				fail("Unexpected success callback");
			}, pool.add(function(error) {
				assertEquals("timeout", error.type);
				assertTrue(new Date().getTime() - time < 1000);
			}));
		});
	}

});