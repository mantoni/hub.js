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
TestCase("Promise2Test", {
	
	"test should be function": function () {
		assertFunction(hub.promise);
	},
	
	"test should return object": function () {
		var promise = hub.promise();
		
		assertObject(promise);
	}
	
});

TestCase("Promise2ThenTest", {
	
	"test should be function": function () {
		var promise = hub.promise();
		
		assertFunction(promise.then);
	},
	
	"test should require function argument": function () {
		var promise = hub.promise();
		
		assertException(function () {
			promise.then({});
		}, "TypeError");
	},
	
	"test should return the promise itself": function () {
		var promise = hub.promise();
		
		var result = promise.then(function () {});
		
		assertSame(promise, result);
	}

});

TestCase("Promise2ResolveTest", {
	
	"test should be function": function () {
		var promise = hub.promise();
		
		assertFunction(promise.resolve);
	},
	
	"test should invoke then callbacks": function () {
		var promise = hub.promise();
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		promise.then(spy1);
		promise.then(spy2);
		
		promise.resolve("Test", 123);
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledWith(spy1, "Test", 123);
		sinon.assert.calledOnce(spy2);
		sinon.assert.calledWith(spy2, "Test", 123);
		sinon.assert.callOrder(spy1, spy2);
	},
	
	"test should invoke callback immediately if already resolved": function () {
		var promise = hub.promise();
		promise.resolve("Test", 123);
		var spy = sinon.spy();
		
		promise.then(spy);
		
		sinon.assert.calledOnce(spy);
		sinon.assert.calledWith(spy, "Test", 123);
	},
	
	"test should throw if already resolved": function () {
		var promise = hub.promise();
		promise.resolve();
		
		assertException(function () {
			promise.resolve();
		});
	},
	
	"test should return the promise itself": function () {
		var promise = hub.promise();
		
		var result = promise.resolve();
		
		assertSame(promise, result);
	},
	
	"test should use scope from constructor": function () {
		var scope = {};
		var promise = hub.promise(0, scope);
		var spy = sinon.spy();
		promise.then(spy);
		
		promise.resolve();
		
		sinon.assert.calledOn(spy, scope);
	}
	
});

TestCase("Promise2RejectTest", {
	
	setUp: function () {
		this.clock = sinon.useFakeTimers();
	},
	
	tearDown: function () {
		this.clock.restore();
	},
	
	"test should be function": function () {
		var promise = hub.promise();
		
		assertFunction(promise.reject);
	},
	
	"test should invoke errback": function () {
		var promise = hub.promise();
		var spy = sinon.spy();
		promise.then(fail, spy);
		
		promise.reject("Test", 123);
		
		sinon.assert.calledOnce(spy);
		sinon.assert.calledWith(spy, "Test", 123);
	},
	
	"test should throw if already resolved": function () {
		var promise = hub.promise();
		promise.reject();

		assertException(function () {
			promise.reject();
		});
	},
	
	"test should invoke errback immediately if already rejected": function () {
		var promise = hub.promise();
		promise.reject("Test", 123);
		var spy = sinon.spy();
		
		promise.then(fail, spy);
		
		sinon.assert.calledOnce(spy);
		sinon.assert.calledWith(spy, "Test", 123);
	},

	"test should return the promise itself": function () {
		var promise = hub.promise();
		
		var result = promise.reject();
		
		assertSame(promise, result);
	},
	
	"test should use scope from constructor": function () {
		var scope = {};
		var promise = hub.promise(0, scope);
		var spy = sinon.spy();
		promise.then(fail, spy);
		
		promise.reject();
		
		sinon.assert.calledOn(spy, scope);
	},
	
	"test should be called on timeout": function () {
		var promise = hub.promise(250);
		var spy = sinon.spy();
		promise.then(fail, spy);
		
		this.clock.tick(249);
		
		sinon.assert.notCalled(spy);
		
		this.clock.tick(1);
		
		sinon.assert.calledOnce(spy);
		var error = spy.getCall(0).args[0];
		assert(error instanceof hub.Error);
		assertEquals("timeout", error.type);
		assertEquals("Promise timed out after 250 milliseconds",
			error.toString());
	},

	"test errback should not be called on timeout": function () {
		var promise = hub.promise(250);
		var spy = sinon.spy();
		promise.then(function () {}, spy);

		promise.resolve();
		this.clock.tick(250);
		
		sinon.assert.notCalled(spy);
	}

});
/*
TestCase("Promise2ResolvedTest", {
	
	"test should be function": function () {
		var promise = hub.promise();
		
		assertFunction(promise.resolved);
	},
	
	"test should return false if not resolved": function () {
		var promise = hub.promise();
		
		assertFalse(promise.resolved());
	},
	
	"test should return true if resolved": function () {
		var promise = hub.promise();
		promise.resolve();
		
		assert(promise.resolved());
	},
	
	"test should return true if rejected": function () {
		var promise = hub.promise();
		promise.reject();
		
		assert(promise.resolved());
	}
	
});
*/
TestCase("Promise2WaitTest", {
	
	"test should be function": function () {
		var promise = hub.promise();
		
		assertFunction(promise.wait);
	},
	
	"test should throw if no promise given": function () {
		var promise = hub.promise();
		
		assertException(function () {
			promise.wait({});
		}, "TypeError");
	},
	
	"test should prevent then callback invocation until resolved": function () {
		var promise = hub.promise();
		var spy = sinon.spy();
		promise.then(spy);
		var blocking = hub.promise();
		
		promise.wait(blocking).resolve();
		
		sinon.assert.notCalled(spy);
		
		blocking.resolve();
		
		sinon.assert.calledOnce(spy);
	},
	
	"test should not invoke then callback if joined not resolved": function () {
		var promise = hub.promise();
		var spy = sinon.spy();
		var blocking = hub.promise();
		
		promise.wait(blocking).resolve().then(spy);
		
		sinon.assert.notCalled(spy);

		blocking.resolve();
		
		sinon.assert.calledOnce(spy);
	},
	
	"test should accept multiple blockers": function () {
		var promise = hub.promise();
		var spy = sinon.spy();
		promise.then(spy);
		var blocking1 = hub.promise();
		var blocking2 = hub.promise();
		
		promise.wait(blocking1, blocking2);
		promise.resolve();
		
		sinon.assert.notCalled(spy);
		
		blocking1.resolve();
		
		sinon.assert.notCalled(spy);

		blocking2.resolve();
		
		sinon.assert.calledOnce(spy);
	},
	
	"test should return the promise itself": function () {
		var promise = hub.promise();
		
		var result = promise.wait(hub.promise());
		
		assertSame(promise, result);
	}
	
});

TestCase("Promise2JoinTest", {
	
	"test should be function": function () {
		var promise = hub.promise();
		
		assertFunction(promise.join);
	},
	
	"test should throw if no promise given": function () {
		var promise = hub.promise();
		
		assertException(function () {
			promise.join({});
		}, "TypeError");
	},
	
	"test should return new promise": function () {
		var promise = hub.promise();
		
		var joined = promise.join(hub.promise());
		
		assertObject(joined);
		assertFunction(joined.then);
	},
	
	"test should invoke then if both are resolved": function () {
		var promise1 = hub.promise();
		var promise2 = hub.promise();
		var joined = promise1.join(promise2);
		var spy = sinon.spy();
		joined.then(spy);
		
		sinon.assert.notCalled(spy);
		
		promise2.resolve();
		
		sinon.assert.notCalled(spy);
		
		promise1.resolve();
		
		sinon.assert.calledOnce(spy);
	}
	
});

TestCase("PromiseEmitTest", {
	
	"test should be function": function () {
		var promise = hub.promise();
		
		assertFunction(promise.emit);
	},
	
	"test should emit result": sinon.test(function () {
		var promise = hub.promise();
		this.stub(hub, "emit");
		
		promise.emit("x");
		promise.resolve("Test");
		
		sinon.assert.calledOnce(hub.emit);
		sinon.assert.calledWith(hub.emit, "x", "Test");
	})
	
});