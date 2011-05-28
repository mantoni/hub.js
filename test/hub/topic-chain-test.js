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
 * Test cases for hub.topicChain.
 */
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
		chain.add(fn, "**");
		chain("**");
		sinon.assert.calledOnce(fn);
	},
	
	"test insert 1": function () {
		this.verifyInsertOrder(["foo.*", "*.bar"], ["*.bar", "foo.*"]);
	},
	
	"test insert 2": function () {
		this.verifyInsertOrder(["foo.bar", "foo.*", "*.bar"],
			["*.bar", "foo.*", "foo.bar"]);
	},
	
	"test insert 3": function () {
		this.verifyInsertOrder(["foo.*", "foo.bar", "*.bar"],
			["*.bar", "foo.*", "foo.bar"]);
	},
	
	"test insert 4": function () {
		this.verifyInsertOrder(["*.bar", "foo.bar", "foo.*"],
			["*.bar", "foo.*", "foo.bar"]);
	},
	
	"test insert 5": function () {
		this.verifyInsertOrder(["foo.bar", "*.bar", "foo.*"],
			["*.bar", "foo.*", "foo.bar"]);
	},
	
	"test insert 7": function () {
		this.verifyInsertOrder(["*.b", "*.y", "a.b", "x.y"],
			["*.y", "*.b", "x.y", "a.b"]);
	},
	
	"test insert two equal": function () {
		this.verifyInsertOrder(["a.b", "x.y"], ["x.y", "a.b"]);
	},
	
	"test insert two wildcard": function () {
		this.verifyInsertOrder(["a.*", "x.*"], ["x.*", "a.*"]);
	},
	
	verifyInsertOrder: function (inserts, expected) {
		var chain = hub.topicChain();
		var calls = [];
		function caller(name) {
			return function () {
				calls.push(name);
			};
		}
		var i, l;
		for (i = 0, l = inserts.length; i < l; i++) {
			chain.add(caller(inserts[i]), inserts[i]);
		}
		chain("**");
		assertEquals(expected.join(), calls.join());
	},
	
	"test call invokes only matching": function () {
		var chain = hub.topicChain();
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		chain.add(spy1, "a.b");
		chain.add(spy2, "x.y");
		
		chain("x.y");

		sinon.assert.notCalled(spy1);
		sinon.assert.calledOnce(spy2);
	},
	
	"test invoke without topic falls back to chain topic": function () {
		var chain = hub.topicChain("a.b");
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		chain.add(spy1, "a.b");
		chain.add(spy2, "x.y");
		
		chain();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.notCalled(spy2);
	},
	
	"test scope is retained": function () {
		var chain = hub.topicChain();
		var spy = sinon.spy();
		chain.add(spy, "**");
		var object = {};
		chain.call(object);
		assert(spy.calledOn(object));
	}
	
});