/*
 * Test cases for Hub.publish timeouts.

THIS TEST CASE KILLS CHROME!

AsyncTestCase("publish-timeout", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testSimpleTimeout: function(queue) {
		Hub.subscribe("a/b", function() {
			Hub.promise(10); // promise with small timeout, never fulfilled.
		});
		queue.call(function(pool) {
			var time = new Date().getTime();
			Hub.publish("a/b").then(function() {
				fail("Unexpected success callback");
			}, pool.add(function(error) {
				assertObject(error);
				assertEquals("timeout", error.type);
				assert("Timed out in less than 100 ms", new Date().getTime() - time < 100);
			}));
		});
	}

}); */