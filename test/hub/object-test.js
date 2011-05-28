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
 * Test cases for hub.object.
 */
TestCase("ObjectInvokeTest", {

	"test should be function": function () {
		assertFunction(hub.object);
	},
	
	"test should require function argument": function () {
		assertException(function () {
			hub.object({});
		}, "TypeError");
	},
	
	"test should invoke function": function () {
		var fn = sinon.spy();
		
		hub.object(fn);
		
		sinon.assert.calledOnce(fn);
	},
	
	"test should return object": function () {
		var result = hub.object(sinon.spy());
		
		assertObject(result);
	},
	
	"test should invoke hub.mix with object and result": sinon.test(function () {
		this.stub(hub, "mix");
		var test = {
			foo: 123
		};
		hub.object(sinon.stub().returns(test));
		
		assert(hub.mix.called);
		assert(hub.mix.calledWithExactly({}, test));
	}),
	
	"test should pass arguments to function": function () {
		var fn = sinon.spy();
		var args = [123, "abc"];
		
		hub.object(fn, args);
		
		assert(fn.calledWithExactly(args[0], args[1]));
	},
	
	"test should accept string and function": function () {
		assertNoException(function () {
			hub.object("some.string", function () {});
		});
	}
	
});

TestCase("ObjectMixTest", {
	
	"test should have scope with mix function": function () {
		var fn = sinon.spy();
		
		hub.object(fn);
		
		assertFunction(fn.thisValues[0].mix);
	},
	
	"test should invoke hub.get": sinon.test(function () {
		this.stub(hub, "get");
		
		hub.object(function () {
			this.mix();
		});
		
		sinon.assert.calledOnce(hub.get);
	}),
	
	"test should pass arguments to hub.get": sinon.test(function () {
		this.stub(hub, "get");
		
		hub.object(function () {
			this.mix("test", 123, "abc");
		});
		
		sinon.assert.calledWithExactly(hub.get, "test", 123, "abc");
	}),
	
	"test should call hub.mix with result": sinon.test(function () {
		var mixin = {};
		this.stub(hub, "get").returns(mixin);
		this.stub(hub, "mix");	
			
		hub.object(function () {
			this.mix();
		});
		
		// Once called directly and once by hub.object:
		sinon.assert.calledTwice(hub.mix);
		var call = hub.mix.getCall(0);
		assertObject(call.args[0]);
		assertSame(mixin, call.args[1]);
	})

});

TestCase("ObjectSubscribeTest", {
	
	"test should have scope with subscribe function": function () {
		var fn = sinon.spy();
		
		hub.object("namespace", fn);
		
		assertFunction(fn.thisValues[0].subscribe);
	},
	
	"test should throw if no namespace is provided": function () {		
		assertException(function () {
			hub.object(function () {
				this.subscribe("message", function () {});
			});
		}, "TypeError");
	},
	
	"test should throw if no message is provided": function () {		
		assertException(function () {
			hub.object("namespace", function () {
				this.subscribe(null, function () {});
			});
		}, "TypeError");
	},
	
	"test should throw if no callback is provided": function () {		
		assertException(function () {
			hub.object("namespace", function () {
				this.subscribe("message");
			});
		}, "TypeError");
	},
	
	"test should invoke hub.subscribe prefixed with namespace": sinon.test(function () {
		this.stub(hub, "subscribe");
		var fn = function () {};
		
		hub.object("namespace", function () {
			this.subscribe("message", fn);
		});
		
		sinon.assert.calledOnce(hub.subscribe);
		sinon.assert.calledWithExactly(hub.subscribe, "namespace.message", fn);
	})
	
});
