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
		sinon.assert.calledWithExactly(stub, callback, "topic");
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
		sinon.assert.calledWithExactly(stub, callback1, "topic1");
		sinon.assert.calledWithExactly(stub, callback2, "topic2");
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
		sinon.assert.calledWithExactly(stub, callback1, "prefix.topic1");
		sinon.assert.calledWithExactly(stub, callback2, "prefix.topic2");
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