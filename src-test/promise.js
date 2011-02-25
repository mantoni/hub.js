/*
 * Test cases for promise support.
 */
TestCase("promise", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testFulfillPromise: function() {
		var promise = Hub.promise();
		var called = false;
		promise.then(function() {
			called = true;
		});
		promise.fulfill();
		assertTrue(called);
	},
	
	testPromiseQueue: function() {
		var chain = [];
		// then-then-fulfill:
		Hub.promise().then(function() {
			chain.push("a")
		}).then(function() {
			chain.push("b")
		}).fulfill();
		assertEquals("a,b", chain.join());
		// then-fulfill-then:
		Hub.promise().then(function() {
			chain.push("c")
		}).fulfill().then(function() {
			chain.push("d")
		});
		assertEquals("a,b,c,d", chain.join());
	},
	
	testPublishWithThen: function() {
		var chain = [];
		Hub.subscribe("test", "promise", function() {
			chain.push("a");
		});
		Hub.publish("test", "promise").then(function() {
			chain.push("b");
		});
		assertEquals("a,b", chain.join());
	},
	
	testThenWithPromisePublish: function() {
		var chain = [];
		Hub.subscribe("test", "promise", function() {
			chain.push("a");
		});
		Hub.promise().publish("test", "promise").then(function() {
			chain.push("b");
		}).fulfill();
		assertEquals("a,b", chain.join());
	},

	testThenWithHubPublish: function() {
		var chain = [];
		Hub.subscribe("test", "promise", function() {
			chain.push("a");
		});
		Hub.promise().then(function() {
			Hub.publish("test", "promise").then(function() {
				chain.push("b");
			});
		}).then(function() {
			chain.push("c");
		}).fulfill();
		assertEquals("a,b,c", chain.join());
	},
	
	/**
	 * the return value of a subscriber callback is passed as the data
	 * argument the promise.
	 */
	testCallbackReturnString: function() {
		Hub.subscribe("test", "promise", function() {
			return "Hello";
		});
		var result = null;
		Hub.publish("test", "promise").then(function(data) {
			result = data;
		});
		assertEquals("Hello", result);
	},
	
	testCallbackReturnMerge: function() {
		Hub.subscribe("test", "promise.a", function() {
			return ["Hello"];
		});
		Hub.subscribe("test", "promise.b", function() {
			return ["World"];
		});
		var result = null;
		Hub.publish("test", "promise.*").then(function(data) {
			result = data;
		});
		assertEquals("[object Array]", Object.prototype.toString.call(result));
		assertEquals("Hello World", result.join(" "));
	},
	
	testJoinedPromisesFulfill1First: function() {
		var p1, p2, done = false;
		Hub.subscribe("test", "promise.a", function() {
			p1 = Hub.promise();
		});
		Hub.subscribe("test", "promise.b", function() {
			p2 = Hub.promise();
		});
		var p3 = Hub.publish("test/promise.*").then(function() {
			done = true;
		});
		assertFalse(p1 === p2);
		assertFalse(p1 === p3);
		assertFalse(p2 === p3);
		assertFalse(p1.fulfilled());
		assertFalse(p2.fulfilled());
		assertFalse(done);
		p1.fulfill();
		assertTrue(p1.fulfilled());
		assertFalse(p2.fulfilled());
		assertFalse(done);
		p2.fulfill();
		assertTrue(p1.fulfilled());
		assertTrue(p2.fulfilled());
		assertTrue(done);
	},

	testJoinedPromisesFulfill2First: function() {
		var p1, p2, done = false;
		Hub.subscribe("test", "promise.a", function() {
			p1 = Hub.promise();
		});
		Hub.subscribe("test", "promise.b", function() {
			p2 = Hub.promise();
		});
		var p3 = Hub.publish("test/promise.*").then(function() {
			done = true;
		});
		assertFalse(p1 === p2);
		assertFalse(p1 === p3);
		assertFalse(p2 === p3);
		assertFalse(p1.fulfilled());
		assertFalse(p2.fulfilled());
		assertFalse(done);
		p2.fulfill();
		assertFalse(p1.fulfilled());
		assertTrue(p2.fulfilled());
		assertFalse(done);
		p1.fulfill();
		assertTrue(p1.fulfilled());
		assertTrue(p2.fulfilled());
		assertTrue(done);
	}
	
});