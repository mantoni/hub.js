/*jslint undef: true, white: true*/
/*globals Hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.publisher.
 */
(function () {
	
	function publishData(fn) {
		var result;
		Hub.subscribe("a/b", function (data) {
			result = data;
		});
		fn.apply(null, Array.prototype.slice.call(arguments, 1));
		return result;
	}

	TestCase("PublisherTest", {
	
		tearDown: function () {
			Hub.reset();
		},
	
		"test should implement publisher": function () {
			assertFunction(Hub.publisher);
		},
		
		"test should return function": function () {
			var publisher = Hub.publisher("a/b");
			assertFunction(publisher);
		},
	
		"test should not throw on invocation": function () {
			var publisher = Hub.publisher("a/b");
			assertNoException(function () {
				publisher();
			});
			assertNoException(function () {
				publisher(null);
			});
			assertNoException(function () {
				publisher({});
			});
			assertNoException(function () {
				publisher([]);
			});
		},
	
		"test should pass single argument to subscriber": function () {
			var fn = Hub.publisher("a/b");
			assertEquals("data", publishData(fn, "data"));
		},
	
		"test should merge argument": function () {
			var fn = Hub.publisher("a/b", {x: "x"});
			var d = publishData(fn, {});
			assertEquals("x", d.x);
		},
			
		"test should invoke transformer with one argument": function () {
			var fn = Hub.publisher("a/b", function (msg) {
				return msg + "!";
			});
			assertEquals("Hi!", publishData(fn, "Hi"));
		},
	
		"test should invoke transform with two arguments": function () {
			var fn = Hub.publisher("a/b", function (msg1, msg2) {
				return msg1 + " " + msg2 + "!";
			});
			assertEquals("Hi there!", publishData(fn, "Hi", "there"));
		},
	
		"test should merge data and transform result": function () {
			var fn = Hub.publisher("a/b", function (data) {
				return { x: data };
			}, { y: "y" });
			var d = publishData(fn, "x");
			assertEquals("x", d.x);
			assertEquals("y", d.y);
		},
		
		"test create api": function () {
			var api = Hub.publisher({
				ab: "a/b",
				xy: "x/y"
			});
			assertFunction(api);
			assertFunction(api.ab);
			assertFunction(api.xy);
			var ab = stubFn();
			var xy = stubFn();
			Hub.subscribe("a/b", ab);
			Hub.subscribe("x/y", xy);
			api();
			assert(ab.called);
			assert(xy.called);
			ab.called = false;
			xy.called = false;
			api.ab();
			assert(ab.called);
			assertFalse(xy.called);
			ab.called = false;
			api.xy();
			assertFalse(ab.called);
			assert(xy.called);
		}

	});

}());