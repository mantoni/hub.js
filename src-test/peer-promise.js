/*
 * Test cases for Hub.peer in combination with a promise.
 */
AsyncTestCase("peer & promise", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testPeerAndPromise: function(pool) {
		Hub.peer("test", function() {
			return {
				"defer": function() {
					var promise = Hub.promise();
					setTimeout(function() {
						promise.fulfill("Tadaa!");
					}, 50);
					return promise;
				}
			};
		});
		Hub.publish("test", "defer").then(pool.add(function(args) {
			assertEquals("Tadaa!", args[0]);
		}));
	}

});