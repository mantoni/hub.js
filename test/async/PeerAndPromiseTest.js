/*
 * Test cases for Hub.peer in combination with a promise.
 */
AsyncTestCase("PeerAndPromiseTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test deferred resolve": function(queue) {
		Hub.peer("test", {
			"defer": function() {
				var promise = Hub.promise();
				setTimeout(function() {
					promise.resolve("Tadaa!");
				}, 10);
			}
		});
		
		queue.call(function(pool) {
			Hub.publish("test/defer").then(pool.add(function(value) {
				assertEquals("Tadaa!", value);
			}));
		});
	},
	
	"test deferred resolve and return value merge": function(queue) {
		Hub.peer("test", {
			"defer": function() {
				var promise = Hub.promise();
				setTimeout(function() {
					promise.resolve(["Tadaa!"]);
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