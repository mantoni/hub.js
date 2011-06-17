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
 * Test cases for hub.chain.
 */
TestCase("ChainCreateTest", {
	
	"test should create empty chain": function () {
		var chain = hub.chain();

		assertFunction(chain.add);
		assertFunction(chain.insert);
	}
	
});

TestCase("ChainCallTest", {
	
	"test should invoke provided functions": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var chain = hub.chain(spy1, spy2);
		
		chain();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.callOrder(spy1, spy2);
	},
	
	"test should create and return promise": sinon.test(function () {
		var spy = this.spy(hub, "promise");
		var chain = hub.chain();
		
		var promise = chain();
		
		sinon.assert.calledOnce(spy);
		assertSame(spy.returnValues[0], promise);
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

TestCase("ChainRemoveTest", {
	
	"test remove first of two": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var chain = hub.chain(spy1, spy2);
		
		chain.remove(spy1);
		chain();
		
		sinon.assert.notCalled(spy1);
		sinon.assert.called(spy2);
	},
	
	"test remove second of two": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var chain = hub.chain(spy1, spy2);
		
		chain.remove(spy2);
		chain();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.notCalled(spy2);
	},
	
	"test remove first of three": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		var chain = hub.chain(spy1, spy2, spy3);
		
		chain.remove(spy1);
		chain();
		
		sinon.assert.notCalled(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.calledOnce(spy3);
	},
	
	"test remove second of three": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		var chain = hub.chain(spy1, spy2, spy3);

		chain.remove(spy2);
		chain();

		sinon.assert.calledOnce(spy1);
		sinon.assert.notCalled(spy2);
		sinon.assert.calledOnce(spy3);
	},
	
	"test remove third of three": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		var chain = hub.chain(spy1, spy2, spy3);
		
		chain.remove(spy3);
		chain();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.notCalled(spy3);
	}

});

TestCase("ChainConcurrencyTest", {
	
	"test should allow add during invocation": function () {
		var calls = 0;
		var spy = sinon.spy();
		var chain = hub.chain();
		
		chain.add(function () {
			calls++;
			chain.add(spy);
		});
		chain();
		
		assertEquals(1, calls);
		sinon.assert.notCalled(spy);
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

TestCase("ChainNestingTest", {
	
	"test should invoke nested chain": function () {
		var spy = sinon.spy();
		var chain1 = hub.chain(spy);
		var chain2 = hub.chain(chain1);
		
		chain2();
		
		sinon.assert.calledOnce(spy);
	},
	
	"test should abort parent": function () {
		var chain1 = hub.chain(function () {
			this.stopPropagation();
		});
		var spy = sinon.spy();
		var chain2 = hub.chain(chain1, spy);
		
		chain2();
		
		sinon.assert.notCalled(spy);
	},
	
	"test should propagate to parent": function () {
		var spy = sinon.spy();
		var chain1 = hub.chain(function () {
			this.propagate();
			sinon.assert.calledOnce(spy);
		});
		var chain2 = hub.chain(chain1, spy);
		
		chain2();
	},
	
	"test should merge results": function () {
		var chain1 = hub.chain(function () {
			return [1];
		});
		var chain2 = hub.chain(function () {
			return [2];
		});
		var spy = sinon.spy();
		
		var chain3 = hub.chain(chain1, chain2);
		chain3().then(spy);
		
		sinon.assert.calledWith(spy, [1, 2]);
	},
	
	"test should pass arguments through": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var c1 = hub.chain(spy1);
		var c2 = hub.chain(spy2);
		
		hub.chain(c1, c2)("x");
		
		sinon.assert.calledWithExactly(spy1, "x");
		sinon.assert.calledWithExactly(spy2, "x");
	}
	
});
