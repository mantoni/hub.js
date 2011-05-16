/*jslint undef: true, white: true*/
/*globals hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
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
		var fn = stubFn();
		
		hub.object(fn);
		
		assert(fn.called);
	},
	
	"test should return object": function () {
		var result = hub.object(stubFn());
		
		assertObject(result);
	},
	
	"test should invoke hub.mix with object and result": function () {
		var mix = hub.mix;
		hub.mix = stubFn();
		try {
			var test = {
				foo: 123
			};
			hub.object(stubFn(test));
			
			assert(hub.mix.called);
			assertEquals({0: {}, 1: test}, hub.mix.args);
		} finally {
			hub.mix = mix;
		}
	},
	
	"test should pass arguments to function": function () {
		var fn = stubFn();
		var args = [123, "abc"];
		
		hub.object(fn, args);
		
		assertSame(fn.args[0], args[0]);
		assertSame(fn.args[1], args[1]);
	}
	
});

TestCase("ObjectMixTest", {
	
	"test should have scope with mix function": function () {
		var fn = stubFn();
		
		hub.object(fn);
		
		assertFunction(fn.scope.mix);
	},
	
	"test should invoke hub.get": function () {
		var get = hub.get;
		hub.get = stubFn();
		try {
			hub.object(function () {
				this.mix();
			});
			
			assert(hub.get.called);
		} finally {
			hub.get = get;
		}
	},
	
	"test should pass arguments to hub.get": function () {
		var get = hub.get;
		hub.get = stubFn();
		try {
			hub.object(function () {
				this.mix("test", 123, "abc");
			});
			
			assertEquals({0: "test", 1: 123, 2: "abc"}, hub.get.args);
		} finally {
			hub.get = get;
		}
	},
	
	"test should call hub.mix with result": function () {
		var mixin = {};
		var get = hub.get;
		hub.get = stubFn(mixin);
		var mix = hub.mix;
		hub.mix = stubFn();
		try {
			hub.object(function () {
				this.mix();
				// verify here or else hub.mix gets called again.
				assert(hub.mix.called);
				assertObject(hub.mix.args[0]);
				assertSame(mixin, hub.mix.args[1]);
			});			
		} finally {
			hub.get = get;
			hub.mix = mix;
		}
	}

});