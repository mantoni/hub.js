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
		this.stub(hub, property);
		var scope = hub.topicScope("topic");
		
		scope[property]("test", function () {});
		
		sinon.assert.calledOnce(hub[property]);
		sinon.assert.calledWith(hub[property], "test");
	});
	
	TestCase("TopicScopeTest", {
		
		tearDown: function () {
			hub.reset();
		},
		
		"test should be function": function () {
			assertFunction(hub.topicScope);
		},
		
		"test should implement methods on scope": sinon.test(function () {		
			var scope = hub.topicScope("x");
			
			assertString(scope.topic);
			assertFunction(scope.on);
			assertFunction(scope.un);
			assertFunction(scope.peer);
			assertFunction(scope.emit);
			assertFunction(scope.create);
		}),
		
		"test should expose topic": function () {
			var scope = hub.topicScope("x");
			
			assertEquals("x", scope.topic);
		},
		
		"test should prefix topic according to context": sinon.test(
			function () {
				this.stub(hub, "on");
				var scope = hub.topicScope("some.topic");
			
				scope.on("test", function () {});
			
				sinon.assert.calledOnce(hub.on);
				sinon.assert.calledWith(hub.on, "some.test");
			}
		),
	
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
	
	"test should validate topic": function () {
		assertException(function () {
			hub.on("some/topic", function () {});
		}, "Error");
	}
		
});
	
TestCase("OnFunctionTest", {

	tearDown: function () {
		hub.reset();
	},
	
	"test should invoke hub.root.add": sinon.test(function () {
		this.stub(hub.root, "on");
		var callback = function () {};
		
		hub.on("topic", callback);
		
		sinon.assert.calledOnce(hub.root.on);
		sinon.assert.calledWithExactly(hub.root.on, "topic", callback);
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

/*
 * Test cases for hub.peer.
 */
TestCase("PeerTest", {
	
	"test should be function": function () {
		assertFunction(hub.peer);
	},
	
	"test should invoke hub.root.peer and delegate arguments": sinon.test(
		function () {
			this.stub(hub.root, "peer");
			
			var object = {};
			hub.peer("topic", object);
			
			sinon.assert.calledOnce(hub.root.peer);
			sinon.assert.calledWithExactly(hub.root.peer, "topic", object);
		}
	)

});