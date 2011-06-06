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
 * Test cases for promise support.
 */
TestCase("PromiseTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test resolve promise": function () {
		var fn = sinon.spy();
		hub.promise().then(fn).resolve();
		sinon.assert.calledOnce(fn);
	},
	
	"test promise queue 1": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		
		// then-then-resolve:
		hub.promise().then(spy1).then(spy2).resolve();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.callOrder(spy1, spy2);
	},
	
	"test promise queue 2": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();

		// then-resolve-then:
		hub.promise().then(spy1).resolve().then(spy2);
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.callOrder(spy1, spy2);
	},
	
	"test emit with then": function () {
		var chain = [];
		hub.on("test.promise", function () {
			chain.push("a");
		});
		hub.emit("test.promise").then(function () {
			chain.push("b");
		});
		assertEquals("a,b", chain.join());
	},
	
	"test then with promise emit": function () {
		var chain = [];
		hub.on("test.promise", function () {
			chain.push("a");
		});
		hub.promise().emit("test.promise").then(function () {
			chain.push("b");
		}).resolve();
		assertEquals("a,b", chain.join());
	},
	
	"test return value is not used as parameter on emit": function () {
		hub.on("test.promise", function () {
			return "Test";
		});
		var value = "replaced with undefined";
		hub.on("test.other", function (arg) {
			value = arg;
		});
		hub.promise().emit("test.promise").emit("test.other").resolve();
		assertUndefined(value);
	},

	"test return value is used as parameter on emitResult": function () {
		hub.on("test.promise", function () {
			return "Test";
		});
		var value = "replaced with return value";
		hub.on("test.other", function (arg) {
			value = arg;
		});
		hub.emit("test.promise").emitResult("test.other");
		assertEquals("Test", value);
	},

	"test return value is used as parameter on emitResult (explicit resolve)": function () {
		hub.on("test.promise", sinon.stub().returns("Test"));
		var spy = sinon.spy();
		hub.on("test.other", spy);
		
		hub.promise().emit("test.promise").emitResult(
			"test.other"
		).resolve();
		
		sinon.assert.calledOnce(spy);
		sinon.assert.calledWithExactly(spy, "Test");
	},

	"test then with hub emit": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		hub.on("test.promise", spy1);
		var nested = function () {
			hub.emit("test.promise").then(spy2);
		};
		
		hub.promise().then(nested).then(spy3).resolve();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.calledOnce(spy3);
	},
	
	/**
	 * the return value of a subscriber callback is passed as the data
	 * argument the promise.
	 */
	"test callback return string": function () {
		hub.on("test.promise", sinon.stub().returns("Hello"));
		var spy = sinon.spy();
		
		hub.emit("test.promise").then(spy);
		
		sinon.assert.calledWithExactly(spy, "Hello");
	},

	"test callback return string multicasting": function () {
		hub.on("test.promise", sinon.stub().returns("Hello"));
		var spy = sinon.spy();

		hub.emit("test.*").then(spy);
		
		sinon.assert.calledWithExactly(spy, "Hello");
	},
	
	"test callback return merge": function () {
		hub.on("test.promise.a", sinon.stub().returns(["World"]));
		hub.on("test.promise.b", sinon.stub().returns(["Hello"]));
		var spy = sinon.spy();

		hub.emit("test.promise.*").then(spy);
		
		sinon.assert.calledWithExactly(spy, ["Hello", "World"]);
	},
	
	"test emit result": function () {
		hub.on("test.promise.a", function () {
			return "Check";
		});
		var spy = sinon.spy();
		hub.on("test.promise.b", spy);
		
		hub.emit("test.promise.a").emitResult("test.promise.b");

		sinon.assert.calledOnce(spy);
		sinon.assert.calledWithExactly(spy, "Check");
	},
	
	"test joined promises resolve #1 first": function () {
		var p1, p2, done = false;
		hub.on("test.promise.a", function () {
			p1 = hub.promise();
		});
		hub.on("test.promise.b", function () {
			p2 = hub.promise();
		});
		var p3 = hub.emit("test.promise.*").then(function () {
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
		hub.on("test.promise.a", function () {
			p1 = hub.promise();
		});
		hub.on("test.promise.b", function () {
			p2 = hub.promise();
		});
		var p3 = hub.emit("test.promise.*").then(function () {
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
		var fn = sinon.spy();
		
		p1.join(p2).then(fn);
		p2.resolve("b");
		p1.resolve("a");
		
		assert(fn.calledOnce);
		assert(fn.calledWithExactly("a", "b"));
	},
	
	"test join three resolve arguments": function () {
		var p1 = hub.promise();
		var p2 = hub.promise();
		var p3 = hub.promise();
		var fn = sinon.spy();
		p1.join(p2).join(p3).then(fn);
		p1.resolve("a");
		p3.resolve("c");
		p2.resolve("b");
		
		assert(fn.calledOnce);
		assert(fn.calledWith("a", "b", "c"));
	},
	
	"test join promise proxy": function () {
		hub.on("a.b", sinon.spy());
		hub.on("a.c", sinon.spy());
		var fn = sinon.spy();
		
		hub.emit("a.b").join(hub.emit("a.c")).then(fn);
		
		assert(fn.calledOnce);
	},
	
	"test join resolved": function () {
		var p1 = hub.promise();
		var p2 = hub.promise();
		var fn = sinon.spy();
		
		p1.resolve("test");
		p1.join(p2).then(fn);
		p2.resolve("case");
		
		assert(fn.calledOnce);
		assert(fn.calledWithExactly("test", "case"));
	},
	
	"test then return value stored as promise value": function () {
		var spy = sinon.spy();
		var stub = sinon.stub().returns("test");
		
		var p1 = hub.promise().resolve();
		p1.then(stub).then(spy);		
		
		sinon.assert.calledOnce(spy);
		sinon.assert.calledWithExactly(spy, "test");
	},
	
	"test promise rejected": function () {
		hub.on("test.throw", function () {
			hub.promise();
			throw new Error();
		});
		var spy = sinon.spy();
		
		hub.emit("test.throw").then(function () {
			fail("Unexpected success");
		}, spy);
		
		sinon.assert.calledOnce(spy);
	}
	
});