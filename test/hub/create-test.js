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
 * Test cases for hub.create.
 */
TestCase("CreateInvokeTest", {

	"test should be function": function () {
		assertFunction(hub.create);
	},
	
	"test should require function argument": function () {
		assertException(function () {
			hub.create({});
		}, "TypeError");
	},
	
	"test should invoke function": function () {
		var fn = sinon.spy();
		
		hub.create(fn);
		
		sinon.assert.calledOnce(fn);
	},
	
	"test should return object": function () {
		var result = hub.create(sinon.spy());
		
		assertObject(result);
	},
	
	"test should invoke hub.mix with object and result": sinon.test(
		function () {
			this.stub(hub, "mix");
			var test = {
				foo: 123
			};
			var stub = sinon.stub().returns(test);
		
			hub.create(stub);
		
			sinon.assert.calledOnce(hub.mix);
			sinon.assert.calledWithExactly(hub.mix, {}, test);
		}
	),
	
	"test should pass arguments to function": function () {
		var spy = sinon.spy();
		var args = [123, "abc"];
		
		hub.create(spy, args);
		
		sinon.assert.calledWithExactly(spy, args[0], args[1]);
	},
	
	"test should accept string and function": function () {
		assertNoException(function () {
			hub.create("some.string", function () {});
		});
	}
	
});

TestCase("CreateMixTest", {
	
	"test should have scope with mix function": function () {
		var spy = sinon.spy();
		
		hub.create(spy);
		
		assertFunction(spy.thisValues[0].mix);
	},
	
	"test should emit topic": sinon.test(function () {
		this.stub(hub, "emit").returns({
			then: function () {}
		});
		
		hub.create(function () {
			this.mix("topic");
		});
		
		sinon.assert.calledOnce(hub.emit);
		sinon.assert.calledWith(hub.emit, "topic");
	}),
	
	"test should pass arguments to emit": sinon.test(function () {
		this.stub(hub, "emit").returns({
			then: function () {}
		});

		hub.create(function () {
			this.mix("topic", 123, "abc");
		});
		
		sinon.assert.calledWithExactly(hub.emit, "topic", 123, "abc");
	}),
	
	"test should invoke hub.mix with result": sinon.test(function () {
		var promise = hub.promise();
		this.stub(hub, "emit").returns(promise);
		this.stub(hub, "mix");
		
		hub.create(function () {
			this.mix("topic");
		});
		promise.resolve("test");
		
		sinon.assert.calledTwice(hub.mix);
		assertEquals("test", hub.mix.getCall(1).args[1]);
	})

});

TestCase("CreateOnTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should use scope provided by hub.topicScope": sinon.test(
		function () {
			var object = {};
			this.stub(hub, "topicScope").returns(object);
			var spy = sinon.spy();
			
			hub.create("foo", spy);
			
			sinon.assert.calledOnce(hub.topicScope);
			sinon.assert.calledWith(hub.topicScope, "foo");
			sinon.assert.calledOn(spy, object);
		}
	),
	
	"test should use scope provided by hub.scope": sinon.test(
		function () {
			var object = {};
			this.stub(hub, "scope").returns(object);
			var spy = sinon.spy();
			
			hub.create(spy);
			
			sinon.assert.calledOnce(hub.scope);
			sinon.assert.calledOn(spy, object);
		}
	),
	
	"test should throw if no callback is provided": function () {		
		assertException(function () {
			hub.create("topic", function () {
				this.on("message");
			});
		}, "TypeError");
	},
	
	"test should invoke hub.on prefixed with some": sinon.test(
		function () {
			this.stub(hub, "on");
			var fn = function () {};
		
			hub.create("some.namespace", function () {
				this.on("message", fn);
			});
		
			sinon.assert.calledOnce(hub.on);
			sinon.assert.calledWithExactly(hub.on, "some.message", fn);
		}
	)
	
});

/*
 * Test cases for hub.mix.
 */
TestCase("MixTest", {
	
	"test should be function": function () {
		assertFunction(hub.mix);
	},
	
	"test should assign function": function () {
		var object = {};
		var spy = sinon.spy();
		
		hub.mix(object, { test: spy });
		object.test();
		
		sinon.assert.calledOnce(spy);
	},
	
	"test should assign only function properties": function () {
		var object = {};
		
		hub.mix(object, { test: 123 });
		
		assertUndefined(object.test);
	},
	
	"test should create chain on override": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var object = {
			test: spy1
		};
		
		hub.mix(object, { test: spy2 });

		object.test();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test should return first argument": function () {
		var first = {};
		var second = {};
		
		var result = hub.mix(first, second);
		
		assertSame(first, result);
	}
	
});


/*
 * Test cases for hub.factory.
 */
TestCase("FactoryTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should be function": function () {
		assertFunction(hub.factory);
	},
	
	"test should return function": function () {
		var factory = hub.factory(function () {});
		
		assertFunction(factory);
	},
	
	"test should invoke hub.create with given topic and fn": sinon.test(
		function () {
			this.stub(hub, "create");
			var fn = function () {};
			var factory = hub.factory("topic", fn);
			
			factory();
			
			sinon.assert.calledOnce(hub.create);
			sinon.assert.calledWith(hub.create, "topic", fn);
		}
	),
	
	"test should require function argument": function () {
		assertException(function () {
			hub.factory("only.topic");
		}, "TypeError");
	}
	
});