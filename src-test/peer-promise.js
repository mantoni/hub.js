/*
 * Test cases for Hub.peer in combination with a promise.
 */
AsyncTestCase("peer & promise", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testPeerAndPromise: function(queue) {
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
		
		queue.call(function(pool) {
			Hub.publish("test", "defer").then(pool.add(function(value) {
				assertEquals("Tadaa!", value);
			}));
		});
	}

});