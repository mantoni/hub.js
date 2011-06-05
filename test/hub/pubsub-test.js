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
 * Test cases for hub.publish.
 */
(function () {

	function assertInvoked(topic, fn) {
		hub.publish(topic);
		assert(topic, fn.called);
		fn.called = false;
	}
	
	function assertNotInvoked(topic, fn) {
		hub.publish(topic);
		assertFalse(topic, fn.called);
	}
	
	TestCase("PublishTest", {
	
		tearDown: function () {
			hub.reset();
		},
	
		"test should implement publish": function () {
			assertFunction(hub.publish);
		},
	
		"test should throw if topic is not string": function () {
			assertException(function () {
				hub.publish(null);
			});
			assertException(function () {
				hub.publish(undefined);
			});
			assertException(function () {
				hub.publish(false);
			});
			assertException(function () {
				hub.publish(true);
			});
			assertException(function () {
				hub.publish({});
			});
			assertException(function () {
				hub.publish([]);
			});
			assertException(function () {
				hub.publish(77);
			});
		},
	
		"test should throw if topic is empty": function () {
			assertException(function () {
				hub.publish("");
			});
		},
	
		"test should throw if topic is invalid": function () {
			assertException(function () {
				hub.publish("foo .doo");
			});
			assertException(function () {
				hub.publish("foo:doo");
			});
		},
	
		"test should not throw if topic is valid": function () {
			assertNoException(function () {
				hub.publish("a");
			});
			assertNoException(function () {
				hub.publish("a.b");
			});
			assertNoException(function () {
				hub.publish("a.*");
			});
			assertNoException(function () {
				hub.publish("*.b");
			});
			assertNoException(function () {
				hub.publish("a.*.b");
			});
			assertNoException(function () {
				hub.publish("a.b.*");
			});
			assertNoException(function () {
				hub.publish("a.*.b.*");
			});
			assertNoException(function () {
				hub.publish("*.a.b");
			});
			assertNoException(function () {
				hub.publish("*.a.*.b");
			});
			assertNoException(function () {
				hub.publish("**.b");
			});
			assertNoException(function () {
				hub.publish("a.**");
			});
		},
	
		"test should find matching subscriber for wildcards": function () {
			var fn = sinon.spy();
			hub.subscribe("a.b.c.d", fn);
			assertInvoked("a.b.c.*", fn);
			assertInvoked("a.b.c.**", fn);
			assertNotInvoked("a.b.*", fn);
			assertInvoked("a.b.**", fn);
			assertInvoked("a.*.c.d", fn);
			assertInvoked("a.**.c.d", fn);
			assertNotInvoked("*.c.d", fn);
			assertInvoked("**.c.d", fn);
		}

	});

}());

(function () {
	
	var checkScopeFunctionPrefix = sinon.test(function (local, global) {
		var publish = hub.publish; // publish gets stubbed in one test case.
		this.stub(hub, "root");
		this.stub(hub, global);
	
		publish("x");	
		var scope = hub.root.thisValues[0];
		scope[local]("test", function () {});
	
		sinon.assert.calledOnce(hub[global]);
		sinon.assert.calledWith(hub[global], "x.test");
	});
	
	TestCase("PublishScopeTest", {
	
		tearDown: function () {
			hub.reset();
		},
	
		"test should create new scope and use with root": sinon.test(function () {
			this.stub(hub, "root");
			this.stub(hub, "scope").returns("test");
				
			hub.publish("x");
		
			sinon.assert.calledOnce(hub.scope);
			assertEquals("test", hub.root.thisValues[0]);
		}),
	
		"test should implement methods on scope": sinon.test(function () {
			this.stub(hub, "root");
		
			hub.publish("x");
		
			var scope = hub.root.thisValues[0];
			assertNotSame(hub, scope);
			assertFunction(scope.on);
			assertFunction(scope.subscribe);
			assertFunction(scope.un);
			assertFunction(scope.unsubscribe);
			assertFunction(scope.peer);
			assertFunction(scope.publish);
		}),
	
		"test on should invoke on with topic prefix": function () {
			checkScopeFunctionPrefix("on", "on");
		},

		"test subscribe should invoke on with topic prefix": function () {
			checkScopeFunctionPrefix("subscribe", "on");
		},

		"test un should invoke un with topic prefix": function () {
			checkScopeFunctionPrefix("un", "un");
		},
	
		"test unsubscribe should invoke un with topic prefix": function () {
			checkScopeFunctionPrefix("unsubscribe", "un");
		},
	
		"test peer should invoke peer with topic prefix": function () {
			checkScopeFunctionPrefix("peer", "peer");
		},
	
		"test publish should invoke publish with topic prefix": function () {
			checkScopeFunctionPrefix("publish", "publish");
		}
		
	});
}());

/*
 * Test cases for hub.subscribe.
 */
TestCase("SubscribeTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should be function": function () {
		assertFunction(hub.subscribe);
	},
	
	"test should implement on as an alias": function () {
		assertFunction(hub.on);
		assertSame(hub.subscribe, hub.on);
	},
	
	"test should throw if callback is missing": function () {
		assertException(function () {
			hub.subscribe("topic");
		}, "TypeError");
	},
	
	"test should throw if topic contains illegal characters": function () {
		assertException(function () {
			hub.subscribe("some/topic", function () {});
		}, "Error");
	}
	
});
	
TestCase("SubscribeFunctionTest", {

	tearDown: function () {
		hub.reset();
	},
	
	"test should invoke hub.root.add": sinon.test(function () {
		var stub = this.stub(hub.root, "add");
		var callback = function () {};
		
		hub.subscribe("topic", callback);
		
		sinon.assert.calledOnce(stub);
		sinon.assert.calledWithExactly(stub, "topic", callback);
	}),
	
	"test subscribe invocation": function () {
		var fn = sinon.spy();
		assertNoException(function () {
			hub.subscribe("a", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.*", fn);
		});
		assertNoException(function () {
			hub.subscribe("*.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.*.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.b.*", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.*.b.*", fn);
		});
		assertNoException(function () {
			hub.subscribe("*.a.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("*.a.*.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("**.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.**", fn);
		});
	},
	
	"test subscribe throws if callback is not object or function": function () {
		assertException(function () {
			hub.subscribe("x.y");
		});
		assertException(function () {
			hub.subscribe("x.y", null);
		});
		assertException(function () {
			hub.subscribe("x.y", true);
		});
		assertException(function () {
			hub.subscribe("x.y", "fail");
		});
		assertException(function () {
			hub.subscribe("x.y", []);
		});
	}
		
});

TestCase("SubscribeObjectTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should accept a map": function () {
		hub.subscribe({});
	},
	
	"test should accept topic and a map": function () {
		hub.subscribe("topic", {});
	},
	
	"test should invoke hub.root.add with each pair": sinon.test(function () {
		var stub = this.stub(hub.root, "add");
		var callback1 = function () {};
		var callback2 = function () {};
		
		hub.subscribe({
			topic1: callback1,
			topic2: callback2
		});
		
		sinon.assert.calledTwice(stub);
		sinon.assert.calledWithExactly(stub, "topic1", callback1);
		sinon.assert.calledWithExactly(stub, "topic2", callback2);
	}),
	
	"test should invoke hub.root.add with topic and each pair": sinon.test(function () {
		var stub = this.stub(hub.root, "add");
		var callback1 = function () {};
		var callback2 = function () {};
		
		hub.subscribe("prefix", {
			topic1: callback1,
			topic2: callback2
		});
		
		sinon.assert.calledThrice(stub);
		sinon.assert.calledWithExactly(stub, "prefix.topic1", callback1);
		sinon.assert.calledWithExactly(stub, "prefix.topic2", callback2);
	}),
	
	"test should store object and return it with hub.publish": function () {
		var object = {
			foo: function () {}
		};
		hub.subscribe("a", object);
		
		var spy = sinon.spy();
		hub.publish("a").then(spy);
		
		var result = spy.getCall(0).args[0];
		assertObject(result);
		assertFunction(result.foo);
	}
	
});

/*
 * Test cases for hub.unsubscribe.
 */
TestCase("UnsubscribeTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test simple unsubscribe": function () {
		var fn = sinon.spy();
		hub.subscribe("x.y", fn);
		hub.publish("x.y");
		sinon.assert.calledOnce(fn);
		fn.called = false;
		hub.unsubscribe("x.y", fn);
		hub.publish("x.y");
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
		hub.subscribe("x.y", f1);
		hub.subscribe("x.y", f2);
		hub.publish("x.y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x.y", f1);
		hub.publish("x.y");
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
		hub.subscribe("x.y", f1);
		hub.subscribe("x.y", f2);
		hub.publish("x.y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x.y", f2);
		hub.publish("x.y");
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
		hub.subscribe("x.y", f1);
		hub.subscribe("x.y", f2);
		hub.subscribe("x.y", f3);
		hub.publish("x.y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x.y", f1);
		hub.publish("x.y");
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
		hub.subscribe("x.y", f1);
		hub.subscribe("x.y", f2);
		hub.subscribe("x.y", f3);
		hub.publish("x.y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x.y", f2);
		hub.publish("x.y");
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
		hub.subscribe("x.y", f1);
		hub.subscribe("x.y", f2);
		hub.subscribe("x.y", f3);
		hub.publish("x.y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		hub.unsubscribe("x.y", f3);
		hub.publish("x.y");
		assertEquals("f2,f1", a.join());
	},
	
	"test publish subscribe publish unsubscribe publish": function () {
		var fn = sinon.spy();
		hub.publish("x.y");
		hub.subscribe("x.y", fn);
		hub.publish("x.y");
		sinon.assert.calledOnce(fn);
		fn.called = false;
		hub.unsubscribe("x.y", fn);
		hub.publish("x.y");
		assertFalse(fn.called);
	},
	
	"test subscribe publish wildcard and unsubscribe": function () {
		var fn = sinon.spy();
		hub.subscribe("x.y", fn);
		hub.publish("x.*");
		sinon.assert.calledOnce(fn);
		fn.called = false;
		hub.unsubscribe("x.y", fn);
		hub.publish("x.*");
		assertFalse(fn.called);
	},
	
	"test unsubscribe throws if callback is not a function": function () {
		assertException(function () {
			hub.unsubscribe("x.y");
		});
		assertException(function () {
			hub.unsubscribe("x.y", null);
		});
		assertException(function () {
			hub.unsubscribe("x.y", true);
		});
		assertException(function () {
			hub.unsubscribe("x.y", {});
		});
		assertException(function () {
			hub.unsubscribe("x.y", []);
		});
	},
	
	"test unsubscribe returns true on success": function () {
		var fn = function () {};
		hub.subscribe("x.y", fn);
		assert(hub.unsubscribe("x.y", fn));
	},
	
	"test unsubscribe returns false on failure": function () {
		assertFalse(hub.unsubscribe("x.y", function () {}));
	},
	
	"test should implement un as an alias to unsubscribe": function () {
		assertFunction(hub.un);
		assertSame(hub.unsubscribe, hub.un);
	}
	
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
	
	"test should invoke create with function and args": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
		var args = [123];
		
		hub.peer(factory, args);
		
		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWith(hub.create, factory, args);
	}),

	"test should invoke create with topic and function": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
				
		hub.peer("topic", factory);
		
		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWith(hub.create, "topic", factory);
	}),

	"test should invoke create with topic, function and args": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
		var args = [123];

		hub.peer("topic", factory, args);

		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWithExactly(hub.create, "topic", factory, args);
	}),

	"test should pass create result to hub.on": sinon.test(function () {
		this.stub(hub, "create").returns("test");
		this.stub(hub, "on");

		hub.peer(function () {});

		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "test");
	}),
	
	"test should pass topic and create result to hub.on": sinon.test(function () {
		this.stub(hub, "create").returns("test");
		this.stub(hub, "on");
		
		hub.peer("topic", function () {});
		
		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "topic", "test");
	}),
	
	"test should pass topic and object to hub.on": sinon.test(function () {
		this.stub(hub, "on");
		var object = {};
		
		hub.peer("topic", object);
		
		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "topic", object);
	})
	
});
