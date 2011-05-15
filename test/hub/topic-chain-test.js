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
 * Test cases for Hub.topicChain.
 */
TestCase("TopicChainTest", {
	
	"test method exists": function () {
		assertFunction(Hub.topicChain);
	},
	
	"test implements add and remove": function () {
		var chain = Hub.topicChain();
		assertFunction(chain.add);
		assertFunction(chain.remove);
	},
	
	"test invoke calls added function": function () {
		var fn = stubFn();
		var chain = Hub.topicChain();
		chain.add(fn, "**/**");
		chain("**/**");
		assert(fn.called);
	},
	
	"test insert 1": function () {
		this.verifyInsertOrder(["foo/*", "*/bar"], ["*/bar", "foo/*"]);
	},
	
	"test insert 2": function () {
		this.verifyInsertOrder(["foo/bar", "foo/*", "*/bar"],
			["*/bar", "foo/*", "foo/bar"]);
	},
	
	"test insert 3": function () {
		this.verifyInsertOrder(["foo/*", "foo/bar", "*/bar"],
			["*/bar", "foo/*", "foo/bar"]);
	},
	
	"test insert 4": function () {
		this.verifyInsertOrder(["*/bar", "foo/bar", "foo/*"],
			["*/bar", "foo/*", "foo/bar"]);
	},
	
	"test insert 5": function () {
		this.verifyInsertOrder(["foo/bar", "*/bar", "foo/*"],
			["*/bar", "foo/*", "foo/bar"]);
	},
	
	"test insert 7": function () {
		this.verifyInsertOrder(["*/b", "*/y", "a/b", "x/y"],
			["*/y", "*/b", "x/y", "a/b"]);
	},
	
	"test insert two equal": function () {
		this.verifyInsertOrder(["a/b", "x/y"], ["x/y", "a/b"]);
	},
	
	"test insert two wildcard": function () {
		this.verifyInsertOrder(["a/*", "x/*"], ["x/*", "a/*"]);
	},
	
	verifyInsertOrder: function (inserts, expected) {
		var chain = Hub.topicChain();
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
		chain("**/**");
		assertEquals(expected.join(), calls.join());
	},
	
	"test call invokes only matching": function () {
		var chain = Hub.topicChain();
		var fn1 = stubFn();
		var fn2 = stubFn();
		chain.add(fn1, "a/b");
		chain.add(fn2, "x/y");
		chain("x/y");
		assertFalse(fn1.called);
		assert(fn2.called);
	},
	
	"test invoke without topic falls back to chain topic": function () {
		var chain = Hub.topicChain("a/b");
		var fn1 = stubFn();
		var fn2 = stubFn();
		chain.add(fn1, "a/b");
		chain.add(fn2, "x/y");
		chain();
		assert(fn1.called);
		assertFalse(fn2.called);
	},
	
	"test scope is retained": function () {
		var chain = Hub.topicChain();
		var fn = stubFn();
		chain.add(fn, "**/**");
		var object = {};
		chain.call(object);
		assertSame(object, fn.scope);
	}
	
});