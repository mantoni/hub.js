/*
 * Test cases for Hub.publish timeouts.
 
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
			Hub.publish("a", "b", null, 10).then(function() {
				fail("Unexpected success callback");
			}, pool.add(function(error) {
				assertObject(error);
				assertEquals("timeout", error.type);
				assert("Timed out in less than 100 ms", new Date().getTime() - time < 100);
				
				// WTF?
			//	fail("For some reason this test has to fail or the browser goes to 100% CPU");
			}));
		});
	}

});*/