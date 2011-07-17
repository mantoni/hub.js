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
		var calls = [];
		function caller(name) {
			return function () {
				calls.push(name);
			};
		}
		
		var i, l;
		for (i = 0, l = inserts.length; i < l; i++) {
			this.node.on(inserts[i], caller(inserts[i]));
		}
		this.node.emit("**");
		
		assertEquals(expected.join(), calls.join());
	}
	
	TestCase("NodeOnTest", {
		
		setUp: function () {
			this.node = hub.node();
		},

		"test insert 1": function () {
			verifyInsertOrder.call(this,
				["foo.*", "*.bar"],
				["*.bar", "foo.*"]
			);
		},
	
		"test insert 2": function () {
			verifyInsertOrder.call(this,
				["foo.bar", "foo.*", "*.bar"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 3": function () {
			verifyInsertOrder.call(this,
				["foo.*", "foo.bar", "*.bar"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 4": function () {
			verifyInsertOrder.call(this,
				["*.bar", "foo.bar", "foo.*"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 5": function () {
			verifyInsertOrder.call(this,
				["foo.bar", "*.bar", "foo.*"],
				["*.bar", "foo.*", "foo.bar"]
			);
		},
	
		"test insert 7": function () {
			verifyInsertOrder.call(this,
				["*.b", "*.y", "a.b", "x.y"],
				["*.y", "*.b", "x.y", "a.b"]
			);
		},
	
		"test insert two equal": function () {
			verifyInsertOrder.call(this,
				["a.b", "x.y"],
				["x.y", "a.b"]
			);
		},
	
		"test insert two wildcard": function () {
			verifyInsertOrder.call(this,
				["a.*", "x.*"],
				["x.*", "a.*"]
			);
		},		
		
		"test should accept object": function () {
			var spy = sinon.spy();
			
			this.node.on({
				test: spy
			});
			this.node.emit("test");
			
			sinon.assert.calledOnce(spy);
		},
		
		"test should subscribe to ** if no topic is given": function () {
			var spy = sinon.spy();
			
			this.node.on(spy);
			this.node.emit("anything");

			sinon.assert.calledOnce(spy);
		},
		
		"test should replace placeholders with wildcards": function () {
			var spy = sinon.spy();
			
			this.node.on("foo.{0}", spy);
			this.node.emit("foo.bar");
			
			sinon.assert.calledOnce(spy);
		},
		
		"test should inject placeholders into arguments": function () {
			var spy = sinon.spy();
			
			this.node.on("foo.{0}", spy);
			this.node.emit("foo.bar");
			
			sinon.assert.calledWith(spy, "bar");
		}
		
	});
	
}());

TestCase("NodeOnObjectTest", {
	
	setUp: function () {
		this.node = hub.node();
	},
	
	"test should accept a map": function () {
		this.node.on({});
	},
	
	"test should accept topic and a map": function () {
		this.node.on("topic", {});
	},
	
	"test should subscribe each pair": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
				
		hub.on({
			"topic.a": spy1,
			"topic.b": spy2
		});
		
		hub.emit("topic.*");
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
	},
	
	"test should subscribe each pair with topic prefix": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
				
		hub.on("topic", {
			"a": spy1,
			"b": spy2
		});
		
		hub.emit("topic.*");
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
	},
	
	"test should store object and return it for emit": function () {
		var object = {
			foo: function () {}
		};
		this.node.on("a", object);

		var spy = sinon.spy();		
		this.node.emit("a").then(spy);
		
		sinon.assert.calledWithExactly(spy, object);
	}
	
});

TestCase("NodeUnTest", {
	
	setUp: function () {
		this.node = hub.node();
	},
	
	"test simple unsubscribe": function () {
		var fn = sinon.spy();
		this.node.on("x.y", fn);		
		this.node.un("x.y", fn);
		this.node.emit("x.y");
		
		assertFalse(fn.called);
	},
	
	"test unsubscribe first in chain of two": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		this.node.on("x.y", f1);
		this.node.on("x.y", f2);
		this.node.emit("x.y");
		
		assertEquals("f2,f1", a.join());
		
		a.length = 0;
		this.node.un("x.y", f1);
		this.node.emit("x.y");
		
		assertEquals("f2", a.join());
	},
	
	"test unsubscribe second in chain of two": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		this.node.on("x.y", f1);
		this.node.on("x.y", f2);
		this.node.emit("x.y");
		
		assertEquals("f2,f1", a.join());
		
		a.length = 0;
		this.node.un("x.y", f2);
		this.node.emit("x.y");
		
		assertEquals("f1", a.join());
	},
	
	"test unsubscribe first in chain of three": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		var f3 = function () {
			a.push("f3");
		};
		this.node.on("x.y", f1);
		this.node.on("x.y", f2);
		this.node.on("x.y", f3);
		this.node.emit("x.y");
		
		assertEquals("f3,f2,f1", a.join());
		
		a.length = 0;
		this.node.un("x.y", f1);
		this.node.emit("x.y");
		
		assertEquals("f3,f2", a.join());
	},
	
	"test unsubscribe second in chain of three": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		var f3 = function () {
			a.push("f3");
		};
		this.node.on("x.y", f1);
		this.node.on("x.y", f2);
		this.node.on("x.y", f3);
		this.node.emit("x.y");
		
		assertEquals("f3,f2,f1", a.join());
		
		a.length = 0;
		this.node.un("x.y", f2);
		this.node.emit("x.y");
		
		assertEquals("f3,f1", a.join());
	},
	
	"test unsubscribe third in chain of three": function () {
		var a = [];
		var f1 = function () {
			a.push("f1");
		};
		var f2 = function () {
			a.push("f2");
		};
		var f3 = function () {
			a.push("f3");
		};
		this.node.on("x.y", f1);
		this.node.on("x.y", f2);
		this.node.on("x.y", f3);
		this.node.emit("x.y");
		
		assertEquals("f3,f2,f1", a.join());
		
		a.length = 0;
		this.node.un("x.y", f3);
		this.node.emit("x.y");
		
		assertEquals("f2,f1", a.join());
	},
	
	"test subscribe emit wildcard and unsubscribe": function () {
		var fn = sinon.spy();
		hub.on("x.y", fn);
		hub.emit("x.*");
		sinon.assert.calledOnce(fn);
		fn.called = false;
		hub.un("x.y", fn);
		hub.emit("x.*");
		assertFalse(fn.called);
	},
	
	"test unsubscribe throws if callback is not a function": function () {
		assertException(function () {
			this.node.un("x.y");
		});
		assertException(function () {
			this.node.un("x.y", null);
		});
		assertException(function () {
			this.node.un("x.y", true);
		});
		assertException(function () {
			this.node.un("x.y", {});
		});
		assertException(function () {
			this.node.un("x.y", []);
		});
	},
	
	"test unsubscribe returns true on success": function () {
		var fn = function () {};
		this.node.on("x.y", fn);
		assert(this.node.un("x.y", fn));
	},
	
	"test unsubscribe returns false on failure": function () {
		assertFalse(this.node.un("x.y", function () {}));
	},
	
	"test should unsubscribe from ** if no topic is given": function () {
		var spy = sinon.spy();
		this.node.on("**", spy);
	
		this.node.un(spy);
		this.node.emit("anything");
		
		sinon.assert.notCalled(spy);
	}
	
});


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

TestCase("NodeEmitScopeTest", {

	setUp: function () {
		this.node = hub.node();
	},

	"test should use given scope": function () {
		var spy = sinon.spy();
		var scope = hub.scope();
		
		this.node.on("x", spy);
		this.node.emit.call(scope, "x");
		
		sinon.assert.calledOn(spy, scope);
	},

	"test should create new scope and use with root": sinon.test(function () {
		var spy = sinon.spy();
		var scope = hub.scope();
		this.stub(hub, "scope").returns(scope);
		
		this.node.on("x", spy);
		this.node.emit("x");
		
		sinon.assert.calledOn(spy, scope);
	}),
	
	"test should pass scope object to hub.topicScope": sinon.test(
		function () {
			this.spy(hub, "topicScope");
			var scope = hub.scope();
			
			this.node.emit.call(scope, "x");
			
			sinon.assert.calledOnce(hub.topicScope);
			sinon.assert.calledWith(hub.topicScope, "x", scope);
		}
	)
	
});

TestCase("NodeEmitSubstituteTest", {
	
	setUp: function () {
		this.node = hub.node();
	},

	"test should substitute placeholders": sinon.test(function () {
		this.spy(hub, "substitute");
		
		this.node.emit("x.{0}", "y");
		
		sinon.assert.calledOnce(hub.substitute);
		sinon.assert.calledWith(hub.substitute, "x.{0}", ["y"]);
	}),

});

TestCase("NodeMixTest", {
	
	setUp: function () {
		this.node = hub.node();
	},

	"test should be function": function () {
		assertFunction(this.node.mix);
	},
	
	"test should invoke on with emit result": sinon.test(function () {
		var promise = hub.promise();
		this.stub(hub, "emit").returns(promise);
		this.stub(this.node, "on");
		
		this.node.mix("topic");
		var object = {};
		promise.resolve(object);
		
		sinon.assert.calledOnce(this.node.on);
		sinon.assert.calledWith(this.node.on, object);
	}),
	
	"test should pass object to on": sinon.test(function () {
		this.stub(this.node, "on");
		
		var object = {};
		this.node.mix(object);
		
		sinon.assert.calledWith(this.node.on, object);
	}),
	
	"test should pass function to on": sinon.test(function () {
		this.stub(this.node, "on");
		
		var fn = function () {};
		this.node.mix(fn);
		
		sinon.assert.calledWith(this.node.on, fn);
	}),
	
	"test should return node itself": function () {
		var result = this.node.mix({});
		
		assertSame(this.node, result);
	}
	
});

TestCase("NodeCreateTest", {
	
	"test should be function": function () {
		var node = hub.node();
		
		assertFunction(node.create);
	},
	
	"test should be same as hub.create": function () {
		var node = hub.node();
		
		assertSame(hub.create, node.create);
	}
	
});

TestCase("NodeFactoryTest", {
	
	"test should be function": function () {
		var node = hub.node();
		
		assertFunction(node.factory);
	},
	
	"test should be same as hub.factory": function () {
		var node = hub.node();
		
		assertSame(hub.factory, node.factory);
	}
	
});

TestCase("NodePeerTest", {
	
	setUp: function () {
		this.node = hub.node();
	},
	
	"test should be function": function () {
		assertFunction(this.node.peer);
	},
	
	"test should invoke create with function": sinon.test(function () {
		this.stub(hub, "create");
		
		var factory = function () {};	
		this.node.peer(factory);
		
		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWith(hub.create, factory);
	}),
	
	"test should invoke create with function and args": sinon.test(
		function () {
			this.stub(hub, "create");
			
			var factory = function () {};
			var args = [123];
			this.node.peer(factory, args);
			
			sinon.assert.calledOnce(hub.create);
			sinon.assert.calledWith(hub.create, factory, args);
		}
	),

	"test should invoke create with topic and function": sinon.test(
		function () {
			this.stub(hub, "create");
			var factory = function () {};
			
			this.node.peer("topic", factory);
			
			sinon.assert.calledOnce(hub.create);
			sinon.assert.calledWith(hub.create, "topic", factory);
		}
	),

	"test should invoke create with topic, function and args": sinon.test(
		function () {
			this.stub(hub, "create");
			var factory = function () {};
			var args = [123];

			this.node.peer("topic", factory, args);

			sinon.assert.calledOnce(hub.create);
			sinon.assert.calledWithExactly(hub.create, "topic", factory, 
				args);
		}
	),

	"test should pass create result to node.on": sinon.test(function () {
		this.stub(hub, "create").returns("test");
		this.stub(this.node, "on");

		this.node.peer(function () {});

		sinon.assert.calledOnce(this.node.on);
		sinon.assert.calledWithExactly(this.node.on, "test");
	}),
	
	"test should pass topic and create result to hub.on": sinon.test(
		function () {
			this.stub(hub, "create").returns("test");
			this.stub(this.node, "on");
		
			this.node.peer("topic", function () {});
		
			sinon.assert.calledOnce(this.node.on);
			sinon.assert.calledWithExactly(this.node.on, "topic", "test");
		}
	),
	
	"test should pass topic and object to hub.on": sinon.test(function () {
		this.stub(this.node, "on");
		var object = {};
		
		this.node.peer("topic", object);
		
		sinon.assert.calledOnce(this.node.on);
		sinon.assert.calledWithExactly(this.node.on, "topic", object);
	})
	
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
