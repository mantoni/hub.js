/*
 * Test cases for Hub.peer in combination with a promise.
 */
AsyncTestCase("PeerAndPromiseTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testDeferredFulfill: function(queue) {
		Hub.peer("test", {
			"defer": function() {
				var promise = Hub.promise();
				setTimeout(function() {
					promise.fulfill("Tadaa!");
				}, 10);
			}
		});
		
		queue.call(function(pool) {
			Hub.publish("test/defer").then(pool.add(function(value) {
				assertEquals("Tadaa!", value);
			}));
		});
	},
	
	testDeferredFulfillAndReturnValueMerge: function(queue) {
		Hub.peer("test", {
			"defer": function() {
				var promise = Hub.promise();
				setTimeout(function() {
					promise.fulfill(["Tadaa!"]);
				}, 10);
				return ["Deferred"];
			}
		});
		
		queue.call(function(pool) {
			Hub.publish("test/defer").then(pool.add(function(value) {
				assertArray(value);
				assertEquals("Deferred Tadaa!", value.join(" "));
			}));
		});
	}

});