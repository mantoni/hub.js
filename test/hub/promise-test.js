/*jslint undef: true, white: true*/
/*globals hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for promise support.
 */
TestCase("PromiseTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test resolve promise": function () {
		var fn = stubFn();
		hub.promise().then(fn).resolve();
		assert(fn.called);
	},
	
	"test promise queue": function () {
		var chain = [];
		// then-then-resolve:
		hub.promise().then(function () {
			chain.push("a");
		}).then(function () {
			chain.push("b");
		}).resolve();
		assertEquals("a,b", chain.join());
		// then-resolve-then:
		hub.promise().then(function () {
			chain.push("c");
		}).resolve().then(function () {
			chain.push("d");
		});
		assertEquals("a,b,c,d", chain.join());
	},
	
	"test publish with then": function () {
		var chain = [];
		hub.subscribe("test/promise", function () {
			chain.push("a");
		});
		hub.publish("test/promise").then(function () {
			chain.push("b");
		});
		assertEquals("a,b", chain.join());
	},
	
	"test then with promise publish": function () {
		var chain = [];
		hub.subscribe("test/promise", function () {
			chain.push("a");
		});
		hub.promise().publish("test/promise").then(function () {
			chain.push("b");
		}).resolve();
		assertEquals("a,b", chain.join());
	},
	
	"test return value is not used as parameter on publish": function () {
		hub.subscribe("test/promise", function () {
			return "Test";
		});
		var value = "replaced with undefined";
		hub.subscribe("test/other", function (arg) {
			value = arg;
		});
		hub.promise().publish("test/promise").publish("test/other").resolve();
		assertUndefined(value);
	},

	"test return value is used as parameter on publishResult": function () {
		hub.subscribe("test/promise", function () {
			return "Test";
		});
		var value = "replaced with return value";
		hub.subscribe("test/other", function (arg) {
			value = arg;
		});
		hub.publish("test/promise").publishResult("test/other");
		assertEquals("Test", value);
	},

	"test return value is used as parameter on publishResult (explicit resolve)": function () {
		hub.subscribe("test/promise", function () {
			return "Test";
		});
		var value = "replaced with return value";
		hub.subscribe("test/other", function (arg) {
			value = arg;
		});
		hub.promise().publish("test/promise").publishResult(
			"test/other"
		).resolve();
		assertEquals("Test", value);
	},

	"test then with hub publish": function () {
		var chain = [];
		hub.subscribe("test/promise", function () {
			chain.push("a");
		});
		hub.promise().then(function () {
			hub.publish("test/promise").then(function () {
				chain.push("b");
			});
		}).then(function () {
			chain.push("c");
		}).resolve();
		assertEquals("a,b,c", chain.join());
	},
	
	/**
	 * the return value of a subscriber callback is passed as the data
	 * argument the promise.
	 */
	"test callback return string": function () {
		hub.subscribe("test/promise", function () {
			return "Hello";
		});
		var result = null;
		hub.publish("test/promise").then(function (data) {
			result = data;
		});
		assertEquals("Hello", result);
	},

	"test callback return string multicasting": function () {
		hub.subscribe("test/promise", function () {
			return "Hello";
		});
		var result = null;
		hub.publish("test/*").then(function (data) {
			result = data;
		});
		assertEquals("Hello", result);
	},
	
	"test callback return merge": function () {
		hub.subscribe("test/promise.a", function () {
			return ["World"];
		});
		hub.subscribe("test/promise.b", function () {
			return ["Hello"];
		});
		var result = null;
		hub.publish("test/promise.*").then(function (data) {
			result = data;
		});
		assertArray(result);
		assertEquals("Hello World", result.join(" "));
	},
	
	"test publish result": function () {
		hub.subscribe("test/promise.a", function () {
			return "Check";
		});
		var fn = stubFn();
		hub.subscribe("test/promise.b", fn);
		hub.publish("test/promise.a").publishResult("test/promise.b");
		assert(fn.called);
		assertEquals(["Check"], fn.args);
	},
	
	"test joined promises resolve #1 first": function () {
		var p1, p2, done = false;
		hub.subscribe("test/promise.a", function () {
			p1 = hub.promise();
		});
		hub.subscribe("test/promise.b", function () {
			p2 = hub.promise();
		});
		var p3 = hub.publish("test/promise.*").then(function () {
			done = true;
		});
		assertFalse(p1 === p2);
		assertFalse(p1 === p3);
		assertFalse(p2 === p3);
		assertFalse(p1.resolved());
		assertFalse(p2.resolved());
		assertFalse(done);
		p1.resolve();
		assert(p1.resolved());
		assertFalse(p2.resolved());
		assertFalse(done);
		p2.resolve();
		assert(p1.resolved());
		assert(p2.resolved());
		assert(done);
	},

	"test joined promises resolve #2 first": function () {
		var p1, p2, done = false;
		hub.subscribe("test/promise.a", function () {
			p1 = hub.promise();
		});
		hub.subscribe("test/promise.b", function () {
			p2 = hub.promise();
		});
		var p3 = hub.publish("test/promise.*").then(function () {
			done = true;
		});
		assertFalse(p1 === p2);
		assertFalse(p1 === p3);
		assertFalse(p2 === p3);
		assertFalse(p1.resolved());
		assertFalse(p2.resolved());
		assertFalse(done);
		p2.resolve();
		assertFalse(p1.resolved());
		assert(p2.resolved());
		assertFalse(done);
		p1.resolve();
		assert(p1.resolved());
		assert(p2.resolved());
		assert(done);
	},
	
	"test should implement join": function () {
		assertFunction(hub.promise().join);
	},
	
	"test join two resolve arguments": function () {
		var p1 = hub.promise();
		var p2 = hub.promise();
		var fn = stubFn();
		p1.join(p2).then(fn);
		p2.resolve("b");
		p1.resolve("a");
		assert(fn.called);
		assertEquals({0: "a", 1: "b"}, fn.args);
	},
	
	"test join three resolve arguments": function () {
		var p1 = hub.promise();
		var p2 = hub.promise();
		var p3 = hub.promise();
		var fn = stubFn();
		p1.join(p2).join(p3).then(fn);
		p1.resolve("a");
		p3.resolve("c");
		p2.resolve("b");
		assert(fn.called);
		assertEquals({0: "a", 1: "b", 2: "c"}, fn.args);
	},
	
	"test join promise proxy": function () {
		hub.subscribe("a/b", stubFn());
		hub.subscribe("a/c", stubFn());
		var fn = stubFn();
		hub.publish("a/b").join(hub.publish("a/c")).then(fn);
		assert(fn.called);
	},
	
	"test join resolved": function () {
		var p1 = hub.promise();
		p1.resolve("test");
		var p2 = hub.promise();
		var fn = stubFn();
		p1.join(p2).then(fn);
		p2.resolve("case");
		assert(fn.called);
		assertEquals({0: "test", 1: "case"}, fn.args);
	},
	
	"test then return value stored as promise value": function () {
		var p1 = hub.promise().resolve();
		var fn = stubFn();
		p1.then(stubFn("test")).then(fn);
		assertEquals({0: "test"}, fn.args);
	},
	
	"test promise rejected": function () {
		hub.subscribe("test/throw", function () {
			hub.promise();
			throw new Error();
		});
		var f = stubFn();
		hub.publish("test/throw").then(function () {
			fail("Unexpected success");
		}, f);
		assert(f.called);
	}
	
});