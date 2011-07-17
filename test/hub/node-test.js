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
TestCase("NodeTest", {

	"test method exists": function () {
		assertFunction(hub.node);
	},

	"test implements emit, add and remove": function () {
		var node = hub.node();
		assertFunction(node.emit);
		assertFunction(node.on);
		assertFunction(node.un);
	},
	
	"test should map config object to on": function () {
		var spy = sinon.spy();
		var node = hub.node({
			test: spy
		});
		
		node.emit("test");
		
		sinon.assert.calledOnce(spy);
	}
	
});

(function () {
	
	function verifyInsertOrder(inserts, expected) {
		var node = hub.node();
		var calls = [];
		function caller(name) {
			return function () {
				calls.push(name);
			};
		}
		
		var i, l;
		for (i = 0, l = inserts.length; i < l; i++) {
			node.on(inserts[i], caller(inserts[i]));
		}
		node.emit("**");
		
		assertEquals(expected.join(), calls.join());
	}
	
	TestCase("NodeOnTest", {

		"test insert 1": function () {
			verifyInsertOrder(
				["foo.*", "*.bar"],
				["*.bar", "foo.*"]
			);
		},
	
		"test insert 2": function () {
			verifyInsertOrder(
				["foo.bar", "foo.*", "*.bar"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 3": function () {
			verifyInsertOrder(
				["foo.*", "foo.bar", "*.bar"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 4": function () {
			verifyInsertOrder(
				["*.bar", "foo.bar", "foo.*"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 5": function () {
			verifyInsertOrder(
				["foo.bar", "*.bar", "foo.*"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 7": function () {
			verifyInsertOrder(
				["*.b", "*.y", "a.b", "x.y"],
				["*.y", "*.b", "x.y", "a.b"]
			);
		},
	
		"test insert two equal": function () {
			verifyInsertOrder(
				["a.b", "x.y"],
				["x.y", "a.b"]
			);
		},
	
		"test insert two wildcard": function () {
			verifyInsertOrder(
				["a.*", "x.*"],
				["x.*", "a.*"]
			);
		}		
				
	});
	
}());

TestCase("NodeEmitTest", {
	
	"test emit calls added function": function () {
		var fn = sinon.spy();
		var node = hub.node();
		node.on("**", fn);
		node.emit("**");
		sinon.assert.calledOnce(fn);
	},
	
	"test emit invokes only matching": function () {
		var node = hub.node();
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		node.on("a.b", spy1);
		node.on("x.y", spy2);
	
		node.emit("x.y");

		sinon.assert.notCalled(spy1);
		sinon.assert.calledOnce(spy2);
	},

	"test emit without topic falls back to chain topic": function () {
		var node = hub.node("a.b");
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		
		node.on("a.b", spy1);
		node.on("x.y", spy2);
		node.emit();
	
		sinon.assert.calledOnce(spy1);
		sinon.assert.notCalled(spy2);
	},
	
	"test should stop if emit was aborted": function () {
		var node = hub.node();
		node.on("*", function () {
			this.stopPropagation();
		});
		var spy = sinon.spy();
		node.on("a", spy);
		
		node.emit("a");
		
		sinon.assert.notCalled(spy);
	},
	
	"test should stop if multicast emit was aborted": function () {
		var node = hub.node();
		var spy = sinon.spy();
		node.on("b", spy);
		node.on("a", function () {
			this.stopPropagation();
		});
		
		node.emit("*");
		
		sinon.assert.notCalled(spy);
	},

	"test should return scope result if aborted": function () {
		var scope = hub.scope();
		var node = hub.node("a");
		node.on("a", function () {
			this.stopPropagation();
			return "test";
		});
		var spy = sinon.spy();
		
		node.emit("a").then(spy);
		
		sinon.assert.calledWith(spy, "test");
	}
	
});

TestCase("NodeMixTest", {
	
	"test should be function": function () {
		var node = hub.node();
		
		assertFunction(node.mix);
	},
	
	"test should invoke hub.mix with emit result": sinon.test(function () {
		var node = hub.node();
		var promise = hub.promise();
		var object = {};
		this.stub(hub, "emit").returns(promise);
		this.stub(hub, "mix");
		
		node.mix("topic");
		promise.resolve("test");
		
		sinon.assert.calledOnce(hub.mix);
		sinon.assert.calledWith(hub.mix, node, "test");
	})
	
});

TestCase("NodePeerTest", {
	
	"test should be function": function () {
		var node = hub.node();
		
		assertFunction(node.peer);
	}
	
});

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

	"test should return -1 for * prefix left and * suffix right":
		function () {
			assertEquals(-1, hub.topicComparator("*.foo", "foo.*"));
		},
	
	"test should return +1 for * suffix left and * prefix right":
		function () {
			assertEquals(1, hub.topicComparator("foo.*", "*.foo"));
		}
	
});
