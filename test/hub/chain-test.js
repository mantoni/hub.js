/*jslint undef: true, white: true*/
/*globals hub sinon TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertBoolean assertString assertFunction assertObject assertArray
	assertException assertNoException
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

		assertFunction(chain.on);
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

TestCase("ChainRemoveTest", {
	
	"test remove first of two": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var chain = hub.chain(spy1, spy2);
		
		chain.un(spy1);
		chain();
		
		sinon.assert.notCalled(spy1);
		sinon.assert.called(spy2);
	},
	
	"test remove second of two": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var chain = hub.chain(spy1, spy2);
		
		chain.un(spy2);
		chain();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.notCalled(spy2);
	},
	
	"test remove first of three": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		var chain = hub.chain(spy1, spy2, spy3);
		
		chain.un(spy1);
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

		chain.un(spy2);
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
		
		chain.un(spy3);
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
		
		chain.on(function () {
			calls++;
			chain.on(spy);
		});
		chain();
		
		assertEquals(1, calls);
		sinon.assert.notCalled(spy);
	}

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
