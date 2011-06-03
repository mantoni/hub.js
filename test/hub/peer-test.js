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
 * Test cases for hub.peer.
 */
TestCase("PeerTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should be function": function () {
		assertFunction(hub.peer);
	},
	
	"test should invoke create with function": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
		
		hub.peer(factory);
		
		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWith(hub.create, factory);
	}),
	
	"test should invoke create with function and args": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
		var args = [123];
		
		hub.peer(factory, args);
		
		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWith(hub.create, factory, args);
	}),

	"test should invoke create with topic and function": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
				
		hub.peer("topic", factory);
		
		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWith(hub.create, "topic", factory);
	}),

	"test should invoke create with topic, function and args": sinon.test(function () {
		this.stub(hub, "create");
		var factory = function () {};
		var args = [123];

		hub.peer("topic", factory, args);

		sinon.assert.calledOnce(hub.create);
		sinon.assert.calledWithExactly(hub.create, "topic", factory, args);
	}),

	"test should pass create result to hub.on": sinon.test(function () {
		this.stub(hub, "create").returns("test");
		this.stub(hub, "on");

		hub.peer(function () {});

		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "test");
	}),
	
	"test should pass topic and create result to hub.on": sinon.test(function () {
		this.stub(hub, "create").returns("test");
		this.stub(hub, "on");
		
		hub.peer("topic", function () {});
		
		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "topic", "test");
	}),
	
	"test should pass topic and object to hub.on": sinon.test(function () {
		this.stub(hub, "on");
		var object = {};
		
		hub.peer("topic", object);
		
		sinon.assert.calledOnce(hub.on);
		sinon.assert.calledWithExactly(hub.on, "topic", object);
	})
	
});
