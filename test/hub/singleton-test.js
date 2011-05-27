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
 * Test cases for hub.singleton.
 */
TestCase("SingletonTest", {
	
	setUp: function () {
		sinon.stub(hub, "peer");
		sinon.stub(hub, "object");
	},
	
	tearDown: function () {
		hub.peer.restore();
		hub.object.restore();
	},
	
	"test should be function": function () {
		assertFunction(hub.singleton);
	},
	
	"test should use hub.peer": function () {
		var object = {};
		
		hub.singleton("name", object);
		
		sinon.assert.calledOnce(hub.peer);
		sinon.assert.calledWith(hub.peer, "name", object);
	},
	
	"test should use hub.object": function () {
		var fn = function () {};
		var args = [123];
		
		hub.singleton("name", fn, args);
		
		sinon.assert.calledOnce(hub.object);
		sinon.assert.calledWithExactly(hub.object, "name", fn, args);
	}
	
});
