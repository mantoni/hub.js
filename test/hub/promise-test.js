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
 * Test cases for promise support.
 */
TestCase("PromiseTest", {
	
	tearDown: function () {
		Hub.reset();
	},
	
	"test resolve promise": function () {
		var fn = stubFn();
		Hub.promise().then(fn).resolve();
		assert(fn.called);
	},
	
	"test promise queue": function () {
		var chain = [];
		// then-then-resolve:
		Hub.promise().then(function () {
			chain.push("a");
		}).then(function () {
			chain.push("b");
		}).resolve();
		assertEquals("a,b", chain.join());
		// then-resolve-then:
		Hub.promise().then(function () {
			chain.push("c");
		}).resolve().then(function () {
			chain.push("d");
		});
		assertEquals("a,b,c,d", chain.join());
	},
	
	"test publish with then": function () {
		var chain = [];
		Hub.subscribe("test/promise", function () {
			chain.push("a");
		});
		Hub.publish("test/promise").then(function () {
			chain.push("b");
		});
		assertEquals("a,b", chain.join());
	},
	
	"test then with promise publish": function () {
		var chain = [];
		Hub.subscribe("test/promise", function () {
			chain.push("a");
		});
		Hub.promise().publish("test/promise").then(function () {
			chain.push("b");
		}).resolve();
		assertEquals("a,b", chain.join());
	},
	
	"test return value is not used as parameter on publish": function () {
		Hub.subscribe("test/promise", function () {
			return "Test";
		});
		var value = "replaced with undefined";
		Hub.subscribe("test/other", function (arg) {
			value = arg;
		});
		Hub.promise().publish("test/promise").publish("test/other").resolve();
		assertUndefined(value);
	},

	"test return value is used as parameter on publishResult": function () {
		Hub.subscribe("test/promise", function () {
			return "Test";
		});
		var value = "replaced with return value";
		Hub.subscribe("test/other", function (arg) {
			value = arg;
		});
		Hub.publish("test/promise").publishResult("test/other");
		assertEquals("Test", value);
	},

	"test return value is used as parameter on publishResult (explicit resolve)": function () {
		Hub.subscribe("test/promise", function () {
			return "Test";
		});
		var value = "replaced with return value";
		Hub.subscribe("test/other", function (arg) {
			value = arg;
		});
		Hub.promise().publish("test/promise").publishResult(
			"test/other"
		).resolve();
		assertEquals("Test", value);
	},

	"test then with hub publish": function () {
		var chain = [];
		Hub.subscribe("test/promise", function () {
			chain.push("a");
		});
		Hub.promise().then(function () {
			Hub.publish("test/promise").then(function () {
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
		Hub.subscribe("test/promise", function () {
			return "Hello";
		});
		var result = null;
		Hub.publish("test/promise").then(function (data) {
			result = data;
		});
		assertEquals("Hello", result);
	},

	"test callback return string multicasting": function () {
		Hub.subscribe("test/promise", function () {
			return "Hello";
		});
		var result = null;
		Hub.publish("test/*").then(function (data) {
			result = data;
		});
		assertEquals("Hello", result);
	},
	
	"test callback return merge": function () {
		Hub.subscribe("test/promise.a", function () {
			return ["World"];
		});
		Hub.subscribe("test/promise.b", function () {
			return ["Hello"];
		});
		var result = null;
		Hub.publish("test/promise.*").then(function (data) {
			result = data;
		});
		assertArray(result);
		assertEquals("Hello World", result.join(" "));
	},
	
	"test publish result": function () {
		Hub.subscribe("test/promise.a", function () {
			return "Check";
		});
		var fn = stubFn();
		Hub.subscribe("test/promise.b", fn);
		Hub.publish("test/promise.a").publishResult("test/promise.b");
		assert(fn.called);
		assertEquals(["Check"], fn.args);
	},
	
	"test joined promises resolve #1 first": function () {
		var p1, p2, done = false;
		Hub.subscribe("test/promise.a", function () {
			p1 = Hub.promise();
		});
		Hub.subscribe("test/promise.b", function () {
			p2 = Hub.promise();
		});
		var p3 = Hub.publish("test/promise.*").then(function () {
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
		Hub.subscribe("test/promise.a", function () {
			p1 = Hub.promise();
		});
		Hub.subscribe("test/promise.b", function () {
			p2 = Hub.promise();
		});
		var p3 = Hub.publish("test/promise.*").then(function () {
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
		assertFunction(Hub.promise().join);
	},
	
	"test join two resolve arguments": function () {
		var p1 = Hub.promise();
		var p2 = Hub.promise();
		var fn = stubFn();
		p1.join(p2).then(fn);
		p2.resolve("b");
		p1.resolve("a");
		assert(fn.called);
		assertEquals({0: "a", 1: "b"}, fn.args);
	},
	
	"test join three resolve arguments": function () {
		var p1 = Hub.promise();
		var p2 = Hub.promise();
		var p3 = Hub.promise();
		var fn = stubFn();
		p1.join(p2).join(p3).then(fn);
		p1.resolve("a");
		p3.resolve("c");
		p2.resolve("b");
		assert(fn.called);
		assertEquals({0: "a", 1: "b", 2: "c"}, fn.args);
	},
	
	"test join promise proxy": function () {
		Hub.subscribe("a/b", stubFn());
		Hub.subscribe("a/c", stubFn());
		var fn = stubFn();
		Hub.publish("a/b").join(Hub.publish("a/c")).then(fn);
		assert(fn.called);
	},
	
	"test join resolved": function () {
		var p1 = Hub.promise();
		p1.resolve("test");
		var p2 = Hub.promise();
		var fn = stubFn();
		p1.join(p2).then(fn);
		p2.resolve("case");
		assert(fn.called);
		assertEquals({0: "test", 1: "case"}, fn.args);
	},
	
	"test then return value stored as promise value": function () {
		var p1 = Hub.promise().resolve();
		var fn = stubFn();
		p1.then(stubFn("test")).then(fn);
		assertEquals({0: "test"}, fn.args);
	},
	
	"test promise rejected": function () {
		Hub.subscribe("test/throw", function () {
			Hub.promise();
			throw new Error();
		});
		var f = stubFn();
		Hub.publish("test/throw").then(function () {
			fail("Unexpected success");
		}, f);
		assert(f.called);
	}
	
});