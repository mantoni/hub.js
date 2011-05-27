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
			hub.stopPropagation();
		}, spy);
		
		chain();
		
		sinon.assert.notCalled(spy);
	},
	
	"test should not override result": function () {
		var chain = hub.chain(sinon.stub().returns(["first"]),
			function () {
				hub.stopPropagation();
				return ["second"];
			}
		);
		
		var result = chain();
		
		assertEquals(["first", "second"], result);
	},
	
	"test should override result": function () {
		var chain = hub.chain(sinon.stub().returns(["first"]),
			function () {
				hub.stopPropagation(["override"]);
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

TestCase("ChainScopeTest", {
	
	"test should retain scope": function () {
		var fn = sinon.spy();
		var chain = hub.chain();
		chain.add(fn);
		var object = {};
		chain.call(object);
		assert(fn.calledOn(object));
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
			hub.stopPropagation();
		});
		var f = sinon.spy();
		var cb = hub.chain(ca, f);
		cb();
		assertFalse(f.called);
	},
	
	"test should propagate to parent": function () {
		var f = sinon.spy();
		var ca = hub.chain(function () {
			hub.propagate();
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
		var args = [];
		var c1 = hub.chain(function (a) {
			args.push(a);
		});
		var c2 = hub.chain(function (a) {
			args.push(a);
		});
		hub.chain(c1, c2)("x");
		assertEquals(["x", "x"], args);
	}
	
});
