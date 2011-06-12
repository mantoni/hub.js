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
 * Test cases for hub.emit.
 */
(function () {

	function assertInvoked(topic, fn) {
		hub.emit(topic);
		assert(topic, fn.called);
		fn.called = false;
	}
	
	function assertNotInvoked(topic, fn) {
		hub.emit(topic);
		assertFalse(topic, fn.called);
	}
	
	TestCase("EmitTest", {
	
		tearDown: function () {
			hub.reset();
		},
	
		"test should implement emit": function () {
			assertFunction(hub.emit);
		},
	
		"test should throw if topic is not string": function () {
			assertException(function () {
				hub.emit(null);
			});
			assertException(function () {
				hub.emit(undefined);
			});
			assertException(function () {
				hub.emit(false);
			});
			assertException(function () {
				hub.emit(true);
			});
			assertException(function () {
				hub.emit({});
			});
			assertException(function () {
				hub.emit([]);
			});
			assertException(function () {
				hub.emit(77);
			});
		},
	
		"test should throw if topic is empty": function () {
			assertException(function () {
				hub.emit("");
			});
		},
	
		"test should throw if topic is invalid": function () {
			assertException(function () {
				hub.emit("foo .doo");
			});
			assertException(function () {
				hub.emit("foo:doo");
			});
		},
	
		"test should not throw if topic is valid": function () {
			assertNoException(function () {
				hub.emit("a");
			});
			assertNoException(function () {
				hub.emit("a.b");
			});
			assertNoException(function () {
				hub.emit("a.*");
			});
			assertNoException(function () {
				hub.emit("*.b");
			});
			assertNoException(function () {
				hub.emit("a.*.b");
			});
			assertNoException(function () {
				hub.emit("a.b.*");
			});
			assertNoException(function () {
				hub.emit("a.*.b.*");
			});
			assertNoException(function () {
				hub.emit("*.a.b");
			});
			assertNoException(function () {
				hub.emit("*.a.*.b");
			});
			assertNoException(function () {
				hub.emit("**.b");
			});
			assertNoException(function () {
				hub.emit("a.**");
			});
		},
	
		"test should find matching subscriber for wildcards": function () {
			var fn = sinon.spy();
			hub.on("a.b.c.d", fn);
			assertInvoked("a.b.c.*", fn);
			assertInvoked("a.b.c.**", fn);
			assertNotInvoked("a.b.*", fn);
			assertInvoked("a.b.**", fn);
			assertInvoked("a.*.c.d", fn);
			assertInvoked("a.**.c.d", fn);
			assertNotInvoked("*.c.d", fn);
			assertInvoked("**.c.d", fn);
		},
		
		"test should create and return promise": sinon.test(function () {
			var spy = this.spy(hub, "promise");

			var result = hub.emit("x");

			sinon.assert.calledOnce(spy);
			assertSame(spy.returnValues[0], result);
		})
		
	});

}());

(function () {
	
	var checkScopeFunctionPrefix = sinon.test(function (property) {
		this.stub(hub, "root");
		this.stub(hub, property);
		
		var scope = hub.topicScope(property);
		scope[property]("test", function () {});
	
		sinon.assert.calledOnce(hub[property]);
		sinon.assert.calledWith(hub[property], property + ".test");
	});
	
	TestCase("TopicScopeTest", {
		
		"test should be function": function () {
			assertFunction(hub.topicScope);
		},
		
		"test should implement methods on scope": sinon.test(function () {		
			var scope = hub.topicScope("x");
			
			assertFunction(scope.on);
			assertFunction(scope.un);
			assertFunction(scope.peer);
			assertFunction(scope.emit);
			assertFunction(scope.create);
		}),
	
		"test on should invoke on with topic prefix": function () {
			checkScopeFunctionPrefix("on");
		},

		"test un should invoke un with topic prefix": function () {
			checkScopeFunctionPrefix("un");
		},
	
		"test peer should invoke peer with topic prefix": function () {
			checkScopeFunctionPrefix("peer");
		},
	
		"test emit should invoke emit with topic prefix": function () {
			checkScopeFunctionPrefix("emit");
		},
			
		"test create should invoke create with topic prefix": function () {
			checkScopeFunctionPrefix("create");
		},
		
		"test factory should invoke factory with topic prefix": function () {
			checkScopeFunctionPrefix("factory");
		},
		
		"test should throw if no topic is provided": function () {		
			var scope = hub.topicScope("x");
			
			assertException(function () {
				scope.on(null, function () {});
			}, "TypeError");
			assertException(function () {
				scope.un(null, function () {});
			}, "TypeError");
			assertException(function () {
				scope.create(null, function () {});
			}, "TypeError");
			assertException(function () {
				scope.peer(null, function () {});
			}, "TypeError");
			assertException(function () {
				scope.emit(null, function () {});
			}, "TypeError");
		},
		
		
	});

}());

TestCase("EmitScopeTest", {

	tearDown: function () {
		hub.reset();
	},

	"test should use given scope": sinon.test(function () {
		this.stub(hub, "root");
		var scope = hub.scope();
		scope.test = "test";
		
		hub.emit.call(scope, "x");
		
		assertEquals("test", hub.root.thisValues[0].test);
	}),

	"test should create new scope and use with root": sinon.test(function () {
		this.stub(hub, "root");
		this.stub(hub, "scope").returns("test");
		
		hub.emit("x");
		
		sinon.assert.calledOnce(hub.scope);
		assertEquals("test", hub.root.thisValues[0]);
	})
	
});


/*
 * Test cases for hub.on.
 */
TestCase("OnTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should be function": function () {
		assertFunction(hub.on);
	},
	
	"test should throw if callback is missing": function () {
		assertException(function () {
			hub.on("topic");
		}, "TypeError");
	},
	
	"test should throw if topic contains illegal characters": function () {
		assertException(function () {
			hub.on("some/topic", function () {});
		}, "Error");
	},
	
	"test should subscribe to ** if no topic is given": sinon.test(function () {
		this.stub(hub.root, "add");
		var fn = function () {};
		hub.on(fn);
		
		sinon.assert.calledWith(hub.root.add, "**", fn);
	})
	
});
	
TestCase("OnFunctionTest", {

	tearDown: function () {
		hub.reset();
	},
	
	"test should invoke hub.root.add": sinon.test(function () {
		var stub = this.stub(hub.root, "add");
		var callback = function () {};
		
		hub.on("topic", callback);
		
		sinon.assert.calledOnce(stub);
		sinon.assert.calledWithExactly(stub, "topic", callback);
	}),
	
	"test should not throw for valid topics": function () {
		var fn = sinon.spy();
		assertNoException(function () {
			hub.on("a", fn);
		});
		assertNoException(function () {
			hub.on("a.b", fn);
		});
		assertNoException(function () {
			hub.on("a.*", fn);
		});
		assertNoException(function () {
			hub.on("*.b", fn);
		});
		assertNoException(function () {
			hub.on("a.*.b", fn);
		});
		assertNoException(function () {
			hub.on("a.b.*", fn);
		});
		assertNoException(function () {
			hub.on("a.*.b.*", fn);
		});
		assertNoException(function () {
			hub.on("*.a.b", fn);
		});
		assertNoException(function () {
			hub.on("*.a.*.b", fn);
		});
		assertNoException(function () {
			hub.on("**.b", fn);
		});
		assertNoException(function () {
			hub.on("a.**", fn);
		});
	},
	
	"test should throw if callback is not object or function": function () {
		assertException(function () {
			hub.on("x.y");
		});
		assertException(function () {
			hub.on("x.y", null);
		});
		assertException(function () {
			hub.on("x.y", true);
		});
		assertException(function () {
			hub.on("x.y", "fail");
		});
		assertException(function () {
			hub.on("x.y", []);
		});
	}
		
});

TestCase("OnObjectTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should accept a map": function () {
		hub.on({});
	},
	
	"test should accept topic and a map": function () {
		hub.on("topic", {});
	},
	
	"test should invoke hub.root.add with each pair": sinon.test(function () {
		var stub = this.stub(hub.root, "add");
		var callback1 = function () {};
		var callback2 = function () {};
		
		hub.on({
			topic1: callback1,
			topic2: callback2
		});
		
		sinon.assert.calledTwice(stub);
		sinon.assert.calledWithExactly(stub, "topic1", callback1);
		sinon.assert.calledWithExactly(stub, "topic2", callback2);
	}),
	
	"test should invoke hub.root.add with topic and each pair": sinon.test(
		function () {
			var stub = this.stub(hub.root, "add");
			var callback1 = function () {};
			var callback2 = function () {};
	
			hub.on("prefix", {
				topic1: callback1,
				topic2: callback2
			});
	
			sinon.assert.calledThrice(stub);
			sinon.assert.calledWithExactly(stub, "prefix.topic1", callback1);
			sinon.assert.calledWithExactly(stub, "prefix.topic2", callback2);
		}
	),
	
	"test should store object and return it for hub.emit": function () {
		var object = {
			foo: function () {}
		};
		hub.on("a", object);
		var spy = sinon.spy();
		
		hub.emit("a").then(spy);
		
		var result = spy.getCall(0).args[0];
		assertObject(result);
		assertFunction(result.foo);
	}
	
});

/*
 * Test cases for hub.un.
 */
TestCase("UnTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test simple unsubscribe": function () {
		var fn = sinon.spy();
		hub.on("x.y", fn);
		hub.emit("x.y");
		sinon.assert.calledOnce(fn);
		fn.called = false;
		hub.un("x.y", fn);
		hub.emit("x.y");
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
		hub.on("x.y", f1);
		hub.on("x.y", f2);
		hub.emit("x.y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		hub.un("x.y", f1);
		hub.emit("x.y");
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
		hub.on("x.y", f1);
		hub.on("x.y", f2);
		hub.emit("x.y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		hub.un("x.y", f2);
		hub.emit("x.y");
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
		hub.on("x.y", f1);
		hub.on("x.y", f2);
		hub.on("x.y", f3);
		hub.emit("x.y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.un("x.y", f1);
		hub.emit("x.y");
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
		hub.on("x.y", f1);
		hub.on("x.y", f2);
		hub.on("x.y", f3);
		hub.emit("x.y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.un("x.y", f2);
		hub.emit("x.y");
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
		hub.on("x.y", f1);
		hub.on("x.y", f2);
		hub.on("x.y", f3);
		hub.emit("x.y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.un("x.y", f3);
		hub.emit("x.y");
		assertEquals("f2,f1", a.join());
	},
	
	"test emit subscribe emit unsubscribe emit": function () {
		var fn = sinon.spy();
		hub.emit("x.y");
		hub.on("x.y", fn);
		hub.emit("x.y");
		sinon.assert.calledOnce(fn);
		fn.called = false;
		hub.un("x.y", fn);
		hub.emit("x.y");
		assertFalse(fn.called);
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
			hub.un("x.y");
		});
		assertException(function () {
			hub.un("x.y", null);
		});
		assertException(function () {
			hub.un("x.y", true);
		});
		assertException(function () {
			hub.un("x.y", {});
		});
		assertException(function () {
			hub.un("x.y", []);
		});
	},
	
	"test unsubscribe returns true on success": function () {
		var fn = function () {};
		hub.on("x.y", fn);
		assert(hub.un("x.y", fn));
	},
	
	"test unsubscribe returns false on failure": function () {
		assertFalse(hub.un("x.y", function () {}));
	},
	
	"test should unsubscribe from ** if no topic is given": sinon.test(function () {
		this.stub(hub.root, "remove");
		var fn = function () {};
		
		hub.un(fn);
		
		sinon.assert.calledWith(hub.root.remove, "**", fn);
	})
		
});

/*
 * Test cases for hub.peer.
 */
TestCase("PeerTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should be function": function () {
		assertFunction(hub.peer);
	},
	
	"test should invoke create with function": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
		
		hub.peer(factory);
		
		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWith(hub.create, factory);
	}),
	
	"test should invoke create with function and args": sinon.test(
		function () {
			this.stub(hub, "create");
			var factory = function () {};
			var args = [123];
		
			hub.peer(factory, args);
		
			sinon.assert.calledOnce(hub.create);
			sinon.assert.calledWith(hub.create, factory, args);
		}
	),

	"test should invoke create with topic and function": sinon.test(
		function () {
			this.stub(hub, "create");
			var factory = function () {};
				
			hub.peer("topic", factory);
		
			sinon.assert.calledOnce(hub.create);
			sinon.assert.calledWith(hub.create, "topic", factory);
		}
	),

	"test should invoke create with topic, function and args": sinon.test(
		function () {
			this.stub(hub, "create");
			var factory = function () {};
			var args = [123];

			hub.peer("topic", factory, args);

			sinon.assert.calledOnce(hub.create);
			sinon.assert.calledWithExactly(hub.create, "topic", factory, args);
		}
	),

	"test should pass create result to hub.on": sinon.test(function () {
		this.stub(hub, "create").returns("test");
		this.stub(hub, "on");

		hub.peer(function () {});

		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "test");
	}),
	
	"test should pass topic and create result to hub.on": sinon.test(
		function () {
			this.stub(hub, "create").returns("test");
			this.stub(hub, "on");
		
			hub.peer("topic", function () {});
		
			sinon.assert.calledOnce(hub.on);
			sinon.assert.calledWithExactly(hub.on, "topic", "test");
		}
	),
	
	"test should pass topic and object to hub.on": sinon.test(function () {
		this.stub(hub, "on");
		var object = {};
		
		hub.peer("topic", object);
		
		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "topic", object);
	})
	
});
