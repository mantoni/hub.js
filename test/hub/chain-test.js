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

TestCase("ScopeTest", {
	
	"test should be function": function () {
		assertFunction(hub.scope);
	},
	
	"test should implement same methods as scope in chain": function () {
		var scope = hub.scope();
		
		assertFunction(scope.propagate);
		assertFunction(scope.stopPropagation);
	},
	
	"test should be usable as scope for chain invocation": function () {
		var scope = hub.scope();
		scope.test = "test";
		var spy = sinon.spy();
		var chain = hub.chain(spy);
		
		chain.call(scope);
		
		assertEquals("test", spy.thisValues[0].test);
	},
	
	"test should be usable as scope for topicChain invocation": function () {
		var scope = hub.scope();
		scope.test = "test";
		var spy = sinon.spy();
		var chain = hub.topicChain();
		chain.add("a", spy);
		
		chain.call(scope);
		
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

(function () {
	
	function verifyInsertOrder(inserts, expected) {
		var chain = hub.topicChain();
		var calls = [];
		function caller(name) {
			return function () {
				calls.push(name);
			};
		}
		
		var i, l;
		for (i = 0, l = inserts.length; i < l; i++) {
			chain.add(inserts[i], caller(inserts[i]));
		}
		chain("**");
		
		assertEquals(expected.join(), calls.join());
	}
	
	TestCase("TopicChainTest", {
	
		"test method exists": function () {
			assertFunction(hub.topicChain);
		},
	
		"test implements add and remove": function () {
			var chain = hub.topicChain();
			assertFunction(chain.add);
			assertFunction(chain.remove);
		},
	
		"test invoke calls added function": function () {
			var fn = sinon.spy();
			var chain = hub.topicChain();
			chain.add("**", fn);
			chain("**");
			sinon.assert.calledOnce(fn);
		},
	
		"test insert 1": function () {
			verifyInsertOrder(["foo.*", "*.bar"], ["*.bar", "foo.*"]);
		},
	
		"test insert 2": function () {
			verifyInsertOrder(["foo.bar", "foo.*", "*.bar"],
				["*.bar", "foo.*", "foo.bar"]);
		},
	
		"test insert 3": function () {
			verifyInsertOrder(["foo.*", "foo.bar", "*.bar"],
				["*.bar", "foo.*", "foo.bar"]);
		},
	
		"test insert 4": function () {
			verifyInsertOrder(["*.bar", "foo.bar", "foo.*"],
				["*.bar", "foo.*", "foo.bar"]);
		},
	
		"test insert 5": function () {
			verifyInsertOrder(["foo.bar", "*.bar", "foo.*"],
				["*.bar", "foo.*", "foo.bar"]);
		},
	
		"test insert 7": function () {
			verifyInsertOrder(["*.b", "*.y", "a.b", "x.y"],
				["*.y", "*.b", "x.y", "a.b"]);
		},
	
		"test insert two equal": function () {
			verifyInsertOrder(["a.b", "x.y"], ["x.y", "a.b"]);
		},
	
		"test insert two wildcard": function () {
			verifyInsertOrder(["a.*", "x.*"], ["x.*", "a.*"]);
		},
	
		"test call invokes only matching": function () {
			var chain = hub.topicChain();
			var spy1 = sinon.spy();
			var spy2 = sinon.spy();
			chain.add("a.b", spy1);
			chain.add("x.y", spy2);
		
			chain("x.y");

			sinon.assert.notCalled(spy1);
			sinon.assert.calledOnce(spy2);
		},
	
		"test invoke without topic falls back to chain topic": function () {
			var chain = hub.topicChain("a.b");
			var spy1 = sinon.spy();
			var spy2 = sinon.spy();
			
			chain.add("a.b", spy1);
			chain.add("x.y", spy2);
			chain();
		
			sinon.assert.calledOnce(spy1);
			sinon.assert.notCalled(spy2);
		},
		
		"test should stop if call was aborted": function () {
			var chain = hub.topicChain();
			chain.add("*", function () {
				this.stopPropagation();
			});
			var spy = sinon.spy();
			chain.add("a", spy);
			
			chain("a");
			
			sinon.assert.notCalled(spy);
		},
		
		"test should stop if multicast call was aborted": function () {
			var chain = hub.topicChain();
			var spy = sinon.spy();
			chain.add("b", spy);
			chain.add("a", function () {
				this.stopPropagation();
			});
			
			chain("*");
			
			sinon.assert.notCalled(spy);
		},
		
		"test should return scope result if aborted": function () {
			var scope = hub.scope();
			var chain = hub.topicChain("a");
			chain.add("a", function () {
				this.stopPropagation();
				return "test";
			});
			var spy = sinon.spy();
			
			chain("a").then(spy);
			
			sinon.assert.calledWith(spy, "test");
		}
				
	});
	
}());

TestCase("TopicComparatorTest", {
	
	"test should be function": function () {
		assertFunction(hub.topicComparator);
	},
	
	"test should return 0 for two simple strings": function () {
		assertEquals(0, hub.topicComparator("foo", "bar"));
	},
	
	"test should return -1 for * suffix left only": function () {
		assertEquals(-1, hub.topicComparator("foo.*", "foo.bar"));
	},

	"test should return +1 for * suffix right only": function () {
		assertEquals(1, hub.topicComparator("foo.bar", "foo.*"));
	},

	"test should return -1 for * prefix left only": function () {
		assertEquals(-1, hub.topicComparator("*.bar", "foo.bar"));
	},

	"test should return +1 for * prefix right only": function () {
		assertEquals(1, hub.topicComparator("foo.bar", "*.bar"));
	},

	"test should return -1 for * prefix left and * suffix right": function () {
		assertEquals(-1, hub.topicComparator("*.foo", "foo.*"));
	},
	
	"test should return +1 for * suffix left and * prefix right": function () {
		assertEquals(1, hub.topicComparator("foo.*", "*.foo"));
	}
	
});
