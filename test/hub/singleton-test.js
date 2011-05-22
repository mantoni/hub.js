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
 * Test cases for hub.singleton.
 */
TestCase("SingletonTest", {
	
	setUp: function () {
		this.peer = hub.peer;
		this.object = hub.object;
		hub.peer = stubFn();
		hub.object = stubFn();
	},
	
	tearDown: function () {
		hub.peer = this.peer;
		hub.object = this.object;
	},
	
	"test should be function": function () {
		assertFunction(hub.singleton);
	},
	
	"test should invoke hub.peer with name and object": function () {
		var object = {};
		hub.singleton("name", object);
		
		assert(hub.peer.called);
		assertEquals("name", hub.peer.args[0]);
		assertSame(object, hub.peer.args[1]);
	},
	
	"test should invoke hub.object with function and args": function () {
		var fn = function () {};
		var args = [123];
		hub.singleton("name", fn, args);
		
		assert(hub.object.called);
		assertSame(fn, hub.object.args[0]);
		assertSame(args, hub.object.args[1]);
	}
	
});
