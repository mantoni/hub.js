/*jslint undef: true, white: true*/
/*globals hub sinon TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.emitter.
 */
(function () {
	
	function emitData(fn) {
		var result;
		hub.on("a.b", function (data) {
			result = data;
		});
		fn.apply(null, Array.prototype.slice.call(arguments, 1));
		return result;
	}

	TestCase("PublisherTest", {
	
		tearDown: function () {
			hub.reset();
		},
	
		"test should implement emitter": function () {
			assertFunction(hub.emitter);
		},
		
		"test should return function": function () {
			var emitter = hub.emitter("a.b");
			assertFunction(emitter);
		},
	
		"test should not throw on invocation": function () {
			var emitter = hub.emitter("a.b");
			assertNoException(function () {
				emitter();
			});
			assertNoException(function () {
				emitter(null);
			});
			assertNoException(function () {
				emitter({});
			});
			assertNoException(function () {
				emitter([]);
			});
		},
	
		"test should pass single argument to subscriber": function () {
			var fn = hub.emitter("a.b");
			assertEquals("data", emitData(fn, "data"));
		},
	
		"test should merge argument": function () {
			var fn = hub.emitter("a.b", {x: "x"});
			var d = emitData(fn, {});
			assertEquals("x", d.x);
		},
			
		"test should invoke transformer with one argument": function () {
			var fn = hub.emitter("a.b", function (msg) {
				return msg + "!";
			});
			assertEquals("Hi!", emitData(fn, "Hi"));
		},
	
		"test should invoke transform with two arguments": function () {
			var fn = hub.emitter("a.b", function (msg1, msg2) {
				return msg1 + " " + msg2 + "!";
			});
			assertEquals("Hi there!", emitData(fn, "Hi", "there"));
		},
	
		"test should merge data and transform result": function () {
			var fn = hub.emitter("a.b", function (data) {
				return { x: data };
			}, { y: "y" });
			var d = emitData(fn, "x");
			assertEquals("x", d.x);
			assertEquals("y", d.y);
		},
		
		"test create api": function () {
			var api = hub.emitter({
				ab: "a.b",
				xy: "x.y"
			});
			assertFunction(api);
			assertFunction(api.ab);
			assertFunction(api.xy);
			var ab = sinon.spy();
			var xy = sinon.spy();
			hub.on("a.b", ab);
			hub.on("x.y", xy);
			api();
			sinon.assert.calledOnce(ab);
			sinon.assert.calledOnce(xy);
			ab.called = false;
			xy.called = false;
			api.ab();
			sinon.assert.called(ab);
			assertFalse(xy.called);
			ab.called = false;
			api.xy();
			assertFalse(ab.called);
			sinon.assert.called(xy);
		}

	});

}());