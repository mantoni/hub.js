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
 * Test cases for hub.get.
 */
TestCase("GetTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should implement get": function () {
		assertFunction(hub.get);
	},
	
	"test should throws if unknown": function () {
		assertException(function () {
			hub.get("unknown");
		});
	},
	
	"test should return singleton peer": function () {
		var fn = stubFn();
		hub.peer("test", {
			key: fn
		});
		var test = hub.get("test");
		assertNotUndefined(test);
		assertSame(test, hub.get("test"));
		assertFunction(test.key);
	},
	
	"test should return prototype peer": function () {
		var fn = stubFn();
		hub.peer("test", function () {
			return {
				key: fn
			};
		});
		var test = hub.get("test");
		assertNotUndefined(test);
		assertNotSame(test, hub.get("test"));
		assertFunction(test.key);
	},
	
	"test should invoke singleton method and subscriber": function () {
		var fn1 = stubFn();
		hub.peer("test", {
			key: fn1
		});
		var fn2 = stubFn();
		hub.subscribe("test/key", fn2);
		var test = hub.get("test");
		test.key();
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test should invoke prototype method and subscriber": function () {
		var fn1 = stubFn();
		hub.peer("test", function () {
			return {
				key: fn1
			};
		});
		var fn2 = stubFn();
		hub.subscribe("test/key", fn2);
		var test = hub.get("test");
		test.key();
		assert(fn1.called);
		assert(fn2.called);
	}

});