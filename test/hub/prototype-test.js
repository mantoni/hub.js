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
 * Test cases for prototype scoped peers.
 */
TestCase("PrototypeTest", {
	
	setUp: function () {
		var fn = stubFn();
		hub.peer("test", function () {
			return {
				stub: fn
			};
		});
		this.fn = fn;
	},
	
	tearDown: function () {
		hub.reset();
	},
	
	"test publish does not invoke method on prototype peer": function () {
		hub.publish("test/stub");
		assertFalse(this.fn.called);
	},
	
	"test publisher does not invoke method on prototype peer": function () {
		hub.publisher("test/stub")();
		assertFalse(this.fn.called);
	},
	
	"test get and invoke method": function () {
		hub.get("test").stub();
		assert(this.fn.called);
	},
	
	"test wildcard subscriber is invoked 1": function () {
		var fn = stubFn();
		hub.subscribe("test/*", fn);
		hub.get("test").stub();
		assert(this.fn.called);
		assert(fn.called);
	},
	
	"test wildcard subscriber is invoked 2": function () {
		var fn = stubFn();
		var instance = hub.get("test");
		hub.subscribe("test/*", fn);
		instance.stub();
		assert(this.fn.called);
		assert(fn.called);
	}
	
});