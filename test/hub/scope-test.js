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
 * Test cases for hub.scope.
 */
TestCase("ScopeTest", {

	"test should be function": function () {
		assertFunction(hub.scope);
	},

	"test should implement stopPropagation": function () {
		var scope = hub.scope();

		assertFunction(scope.stopPropagation);
	},

	"test should implement propagate": function () {
		var scope = hub.scope();

		assertFunction(scope.propagate);
	},

	"test should implement aborted": function () {
		var scope = hub.scope();

		assertFunction(scope.aborted);
	},

	"test should implement result": function () {
		var scope = hub.scope();

		assertFunction(scope.result);
	},

	"test should implement promise": function () {
		var scope = hub.scope();

		assertFunction(scope.promise);
	},

	"test aborted should return false by default": function () {
		var aborted;
		var chain = hub.chain(function () {
			aborted = this.aborted();
		});

		chain();

		assertFalse(aborted);
	},

	"test aborted should return true after stopPropagation": function () {
		var aborted;
		var chain = hub.chain(function () {
			this.stopPropagation();
			aborted = this.aborted();
		});

		chain();

		assert(aborted);
	},

	"test promise should invoke hub.promise": sinon.test(function () {
		var spy = this.spy(hub, "promise");
		var result;
		var chain = hub.chain(function () {
			result = this.promise();
		});

		chain();

		sinon.assert.calledOnce(spy);
		assertSame(spy.returnValues[0], result);
	}),

	"test this.promise should stop chain execution until resolved":
		function () {
			var spy = sinon.spy();
			var promise;
			var chain = hub.chain(function () {
				promise = this.promise();
			}, spy);

			chain();

			sinon.assert.notCalled(spy);

			promise.resolve();

			sinon.assert.calledOnce(spy);
		},

	"test return promise should stop chain execution until resolved":
		function () {
			var spy = sinon.spy();
			var promise;
			var chain = hub.chain(function () {
				return (promise = hub.promise());
			}, spy);

			chain();

			sinon.assert.notCalled(spy);

			promise.resolve();

			sinon.assert.calledOnce(spy);
		},

	"test return this.promise should stop chain execution until resolved":
		function () {
			var spy = sinon.spy();
			var promise;
			var chain = hub.chain(function () {
				return (promise = this.promise());
			}, spy);

			chain();

			sinon.assert.notCalled(spy);

			promise.resolve();

			sinon.assert.calledOnce(spy);
		},

	"test chain result should be promise": function () {
		var chain = hub.chain(function () {
			this.promise();
		});

		var promise = chain();

		assertObject(promise);
		assertFunction(promise.then);
	}

});

TestCase("ChainScopeTest", {
	
	"test should be accepted as scope for chain invocation": function () {
		var scope = hub.scope();
		scope.test = "test";
		var spy = sinon.spy();
		var chain = hub.chain(spy);
		
		chain.call(scope);
		
		assertEquals("test", spy.thisValues[0].test);
	},
	
	"test should be accepted as scope for node.emit invocation": function () {
		var scope = hub.scope();
		scope.test = "test";
		var spy = sinon.spy();
		var node = hub.node();
		node.on("a", spy);
		
		node.emit.call(scope);
		
		assertEquals("test", spy.thisValues[0].test);
	}
	
});

TestCase("ScopeThenTest", {
	
	"test should be function": function () {
		var scope = hub.scope();
		
		assertFunction(scope.then);
	},
	
	"test should invoke promise and call then": sinon.test(function () {
		var scope = hub.scope();
		var promise = {
			then: sinon.spy()
		};
		this.stub(scope, "promise").returns(promise);
		
		var callback = function () {};
		var errback = function () {};
		scope.then(callback, errback);
		
		sinon.assert.calledOnce(scope.promise);
		sinon.assert.calledOnce(promise.then);
		sinon.assert.calledWith(promise.then, callback, errback);
	})

});

TestCase("ScopeJoinTest", {
	
	"test should be function": function () {
		var scope = hub.scope();
		
		assertFunction(scope.join);
	},
	
	"test should invoke promise and call join": sinon.test(function () {
		var scope = hub.scope();
		var promise = {
			join: sinon.spy()
		};
		this.stub(scope, "promise").returns(promise);
		
		scope.join("promise");
		
		sinon.assert.calledOnce(scope.promise);
		sinon.assert.calledOnce(promise.join);
		sinon.assert.calledWith(promise.join, "promise");
	})

});

TestCase("ScopeWaitTest", {
	
	"test should be function": function () {
		var scope = hub.scope();
		
		assertFunction(scope.wait);
	},
	
	"test should invoke promise and call wait": sinon.test(function () {
		var scope = hub.scope();
		var promise = {
			wait: sinon.spy()
		};
		this.stub(scope, "promise").returns(promise);
		
		scope.wait("promise1", "promise2", "promise3");
		
		sinon.assert.calledOnce(scope.promise);
		sinon.assert.calledOnce(promise.wait);
		sinon.assert.calledWith(promise.wait, "promise1", "promise2",
			"promise3");
	})

});

TestCase("ScopeResolveTest", {
	
	"test should be function": function () {
		var scope = hub.scope();
		
		assertFunction(scope.resolve);
	},
	
	"test should invoke promise and call resolve": sinon.test(function () {
		var scope = hub.scope();
		var promise = {
			resolve: sinon.spy()
		};
		this.stub(scope, "promise").returns(promise);
		
		scope.resolve("Test", 123);
		
		sinon.assert.calledOnce(scope.promise);
		sinon.assert.calledOnce(promise.resolve);
		sinon.assert.calledWith(promise.resolve, "Test", 123);
	})

});

TestCase("ScopeRejectTest", {
	
	"test should be function": function () {
		var scope = hub.scope();
		
		assertFunction(scope.reject);
	},
	
	"test should invoke promise and call reject": sinon.test(function () {
		var scope = hub.scope();
		var promise = {
			reject: sinon.spy()
		};
		this.stub(scope, "promise").returns(promise);
		
		scope.reject("Test", 123);
		
		sinon.assert.calledOnce(scope.promise);
		sinon.assert.calledOnce(promise.reject);
		sinon.assert.calledWith(promise.reject, "Test", 123);
	})

});

TestCase("PropagateTest", {
	
	"test should be function": function () {
		var spy = sinon.spy();
		var chain = hub.chain(spy);
		
		chain();
		
		assertFunction(spy.thisValues[0].propagate);
	},
	
	"test should invoke next chain element": function () {
		var calls = [];
		var chain = hub.chain(function () {
			this.propagate();
			calls.push("a");
		}, function () {
			calls.push("b");
		});
		
		chain();
		
		assertEquals("b,a", calls.join());
	},
	
	"test implicit argument propagation": function () {
		var calls = [];
		var chain = hub.chain(function (a, b) {
			calls.push("x", a, b);
		}, function (a, b) {
			calls.push("y", a, b);
		});
		
		chain("a", "b");
		
		assertEquals("x,a,b,y,a,b", calls.join());
	},
	
	"test explicit argument propagation": function () {
		var calls = [];
		var chain = hub.chain(function (a, b) {
			this.propagate();
			calls.push("x", a, b);
		}, function (a, b) {
			calls.push("y", a, b);
		});
		
		chain("a", "b");
		
		assertEquals("y,a,b,x,a,b", calls.join());
	},
	
	"test override result": function () {
		var chain = hub.chain(function () {
			return ["a"];
		}, function () {
			this.propagate(["b"]);
		}, function () {
			return ["c"];
		});
		var spy = sinon.spy();
		
		chain().then(spy);
		
		sinon.assert.calledWith(spy, ["b", "c"]);
	},
	
	"test should return promise": sinon.test(function () {
		var spy = this.spy(hub, "promise");
		var result;
		var chain = hub.chain(function () {
			result = this.propagate();
		});
		
		chain();
		
		assertSame(spy.returnValues[0], result);
	})

});

TestCase("StopPropagationTest", {
	
	"test should stop after invokation": function () {
		var spy = sinon.spy();
		var chain = hub.chain(function () {
			this.stopPropagation();
		}, spy);
		
		chain();
		
		sinon.assert.notCalled(spy);
	},
	
	"test should not override result": function () {
		var chain = hub.chain(sinon.stub().returns(["first"]),
			function () {
				this.stopPropagation();
				return ["second"];
			}
		);
		var spy = sinon.spy();
		
		chain().then(spy);
		
		sinon.assert.calledWith(spy, ["first", "second"]);
	},
	
	"test should override result": function () {
		var chain = hub.chain(sinon.stub().returns(["first"]),
			function () {
				this.stopPropagation(["override"]);
			}
		);
		var spy = sinon.spy();
		
		chain().then(spy);
		
		sinon.assert.calledWith(spy, ["override"]);
	}
	
});
