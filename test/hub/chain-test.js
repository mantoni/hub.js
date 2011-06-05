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
	}
	
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
		
		var result = chain();
		
		assertEquals(["first", "second"], result);
	},
	
	"test should override result": function () {
		var chain = hub.chain(sinon.stub().returns(["first"]),
			function () {
				this.stopPropagation(["override"]);
			}
		);
		
		var result = chain();
		
		assertEquals(["override"], result);
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
		assertFalse(spy2.called);
	},
	
	"test remove first of three": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		var chain = hub.chain(spy1, spy2, spy3);
		chain.remove(spy1);
		chain();
		assertFalse(spy1.called);
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
		assertFalse(spy2.called);
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
		assertFalse(spy3.called);
	}

});

TestCase("ChainConcurrencyTest", {
	
	"test should allow add during invocation": function () {
		var calls = 0;
		var sf = sinon.spy();
		var chain = hub.chain();
		chain.add(function () {
			calls++;
			chain.add(sf);
		});
		chain();
		assertEquals(1, calls);
		assertFalse(sf.called);
	}

});

(function () {
	
	function assertScopeFunction(property) {
		var spy = sinon.spy();
		var chain = hub.chain(spy);
	
		chain();
	
		assertFunction(spy.thisValues[0][property]);
	}
	
	TestCase("ChainScopeTest", {
	
		"test should implement stopPropagation": function () {
			assertScopeFunction("stopPropagation");
		},
		
		"test should implement propagate": function () {
			assertScopeFunction("propagate");
		},
		
		"test should implement aborted": function () {
			assertScopeFunction("aborted");
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
		
		"test should implement result": function () {
			assertScopeFunction("result");
		}
	
	});
}());

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

TestCase("ChainNestingTest", {
	
	"test should invoke nested chain": function () {
		var f = sinon.spy();
		var ca = hub.chain(f);
		var cb = hub.chain(ca);
		cb();
		sinon.assert.calledOnce(f);
	},
	
	"test should abort parent": function () {
		var ca = hub.chain(function () {
			this.stopPropagation();
		});
		var f = sinon.spy();
		var cb = hub.chain(ca, f);
		cb();
		assertFalse(f.called);
	},
	
	"test should propagate to parent": function () {
		var f = sinon.spy();
		var ca = hub.chain(function () {
			this.propagate();
			sinon.assert.calledOnce(f);
		});
		var cb = hub.chain(ca, f);
		cb();
	},
	
	"test should merge results": function () {
		var c1 = hub.chain(function () {
			return [1];
		});
		var c2 = hub.chain(function () {
			return [2];
		});
		assertEquals([1, 2], hub.chain(c1, c2)());
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
			
			var result = chain("a");
			
			assertEquals("test", result);
		}
				
	});
	
}());

TestCase("TopicComparatorTest", {
	
	"test method exists": function () {
		assertFunction(hub.topicComparator);
	},
	
	"test equal": function () {
		assertEquals(0, hub.topicComparator("foo", "bar"));
	},
	
	"test wildcard message": function () {
		assertEquals(-1, hub.topicComparator("foo.*", "foo.bar"));
		assertEquals(1, hub.topicComparator("foo.bar", "foo.*"));
	},

	"test wildcard namespace": function () {
		assertEquals(-1, hub.topicComparator("*.bar", "foo.bar"));
		assertEquals(1, hub.topicComparator("foo.bar", "*.bar"));
	},

	"test namespace before message": function () {
		assertEquals(-1, hub.topicComparator("*.foo", "foo.*"));
		assertEquals(1, hub.topicComparator("foo.*", "*.foo"));
	}
	
});
