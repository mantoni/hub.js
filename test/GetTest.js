/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.get.
 */
TestCase("GetTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test function exists": function() {
		assertFunction(Hub.get);
	},
	
	"test get undefined throws error": function() {
		assertException(function() {
			Hub.get("unknown");
		});
	},
	
	"test get singleton": function() {
		var fn = stubFn();
		Hub.peer("test", {
			key: fn
		});
		var test = Hub.get("test");
		assertNotUndefined(test);
		assertFunction(test.key);
	},
	
	"test get singleton": function() {
		var fn = stubFn();
		Hub.peer("test", {
			key: fn
		});
		var test = Hub.get("test");
		assertNotUndefined(test);
		assertSame(test, Hub.get("test"));
		assertFunction(test.key);
	},
	
	"test get prototype": function() {
		var fn = stubFn();
		Hub.peer("test", function() {
			return {
				key: fn
			};
		});
		var test = Hub.get("test");
		assertNotUndefined(test);
		assertNotSame(test, Hub.get("test"));
		assertFunction(test.key);
	},
	
	"test additional subscriber invoked on singleton": function() {
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
	
	"test additional subscriber invoked on prototype": function() {
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