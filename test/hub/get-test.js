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
		var fn = sinon.spy();
		hub.peer("test", {
			key: fn
		});
		var test = hub.get("test");
		assertNotUndefined(test);
		assertSame(test, hub.get("test"));
		assertFunction(test.key);
	},
	
	"test should return prototype peer": function () {
		var fn = sinon.spy();
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
		var spy1 = sinon.spy();
		hub.peer("test", {
			key: spy1
		});
		var spy2 = sinon.spy();
		hub.subscribe("test/key", spy2);
		var test = hub.get("test");
		test.key();
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
	},
	
	"test should invoke prototype method and subscriber": function () {
		var spy1 = sinon.spy();
		hub.peer("test", function () {
			return {
				key: spy1
			};
		});
		var spy2 = sinon.spy();
		hub.subscribe("test/key", spy2);
		var test = hub.get("test");
		test.key();
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
	},
	
	"test should pass additional arguments to prototype": function () {
		var stub = sinon.stub().returns({});
		hub.peer("a", stub);
		hub.get("a", "one", "two");
		sinon.assert.calledWithExactly(stub, "one", "two");
	}

});