/*jslint undef: true, white: true*/
/*globals hub sinon AsyncTestCase fail assert assertFalse assertNull
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
 * Test cases for hub.peer in combination with a promise.
 */
AsyncTestCase("PeerAndPromiseTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test deferred resolve": function (queue) {
		hub.peer("test", {
			"defer": function () {
				var promise = hub.promise();
				setTimeout(function () {
					promise.resolve("Tadaa!");
				}, 10);
			}
		});
		
		queue.call(function (pool) {
			hub.publish("test.defer").then(pool.add(function (value) {
				assertEquals("Tadaa!", value);
			}));
		});
	},
	
	"test deferred resolve and return value merge": function (queue) {
		hub.peer("test", {
			"defer": function () {
				var promise = hub.promise();
				setTimeout(function () {
					promise.resolve("Deferred");
				}, 10);
				return "Tadaa!";
			}
		});
		
		queue.call(function (pool) {
			hub.publish("test.defer").then(pool.add(function (value1, value2) {
				assertEquals("Deferred", value1);
				assertEquals("Tadaa!", value2);
			}));
		});
	}

});