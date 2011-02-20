/*
 * Test cases for Hub.peer in combination with a promise.
 */
AsyncTestCase("peer-&-promise", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testDeferredFulfill: function(queue) {
		Hub.peer("test", function() {
			return {
				"defer": function() {
					var promise = Hub.promise();
					setTimeout(function() {
						promise.fulfill("Tadaa!");
					}, 50);
				}
			};
		});
		
		queue.call(function(pool) {
			Hub.publish("test", "defer").then(pool.add(function(value) {
				assertEquals("Tadaa!", value);
			}));
		});
	},
	
	testDeferredFulfillAndReturnValueMerge: function(queue) {
		Hub.peer("test", function() {
			return {
				"defer": function() {
					var promise = Hub.promise();
					setTimeout(function() {
						promise.fulfill(["Tadaa!"]);
					}, 50);
					return ["Deferred"];
				}
			};
		});
		
		queue.call(function(pool) {
			Hub.publish("test", "defer").then(pool.add(function(value) {
				assertEquals("Deferred Tadaa!", value.join(" "));
			}));
		});
	}

});