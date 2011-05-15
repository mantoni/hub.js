/*jslint undef: true, white: true*/
/*globals Hub stubFn AsyncTestCase fail assert assertFalse assertNull
	assertNotNull assertUndefined assertNotUndefined assertSame assertNotSame
	assertEquals assertFunction assertObject assertArray assertException
	assertNoException setTimeout
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.peer in combination with a promise.
 */
AsyncTestCase("PeerAndPromiseTest", {
	
	tearDown: function () {
		Hub.reset();
	},
	
	"test deferred resolve": function (queue) {
		Hub.peer("test", {
			"defer": function () {
				var promise = Hub.promise();
				setTimeout(function () {
					promise.resolve("Tadaa!");
				}, 10);
			}
		});
		
		queue.call(function (pool) {
			Hub.publish("test/defer").then(pool.add(function (value) {
				assertEquals("Tadaa!", value);
			}));
		});
	},
	
	"test deferred resolve and return value merge": function (queue) {
		Hub.peer("test", {
			"defer": function () {
				var promise = Hub.promise();
				setTimeout(function () {
					promise.resolve("Deferred");
				}, 10);
				return "Tadaa!";
			}
		});
		
		queue.call(function (pool) {
			Hub.publish("test/defer").then(pool.add(function (value1, value2) {
				assertEquals("Deferred", value1);
				assertEquals("Tadaa!", value2);
			}));
		});
	}

});