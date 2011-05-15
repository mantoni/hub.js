/*jslint undef: true, white: true*/
/*globals Hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.get.
 */
TestCase("GetTest", {
	
	tearDown: function () {
		Hub.reset();
	},
	
	"test should implement get": function () {
		assertFunction(Hub.get);
	},
	
	"test should throws if unknown": function () {
		assertException(function () {
			Hub.get("unknown");
		});
	},
	
	"test should return singleton peer": function () {
		var fn = stubFn();
		Hub.peer("test", {
			key: fn
		});
		var test = Hub.get("test");
		assertNotUndefined(test);
		assertSame(test, Hub.get("test"));
		assertFunction(test.key);
	},
	
	"test should return prototype peer": function () {
		var fn = stubFn();
		Hub.peer("test", function () {
			return {
				key: fn
			};
		});
		var test = Hub.get("test");
		assertNotUndefined(test);
		assertNotSame(test, Hub.get("test"));
		assertFunction(test.key);
	},
	
	"test should invoke singleton method and subscriber": function () {
		var fn1 = stubFn();
		Hub.peer("test", {
			key: fn1
		});
		var fn2 = stubFn();
		Hub.subscribe("test/key", fn2);
		var test = Hub.get("test");
		test.key();
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test should invoke prototype method and subscriber": function () {
		var fn1 = stubFn();
		Hub.peer("test", function () {
			return {
				key: fn1
			};
		});
		var fn2 = stubFn();
		Hub.subscribe("test/key", fn2);
		var test = Hub.get("test");
		test.key();
		assert(fn1.called);
		assert(fn2.called);
	}

});