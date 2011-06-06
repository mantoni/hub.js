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
 * Test cases for emit and subscribe.
 */
TestCase("PublishSubscribeTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test emit calls subscriber with same topic": function () {
		var spy = sinon.spy();
		hub.on("x.y", spy);
		
		hub.emit("x.y");
		
		sinon.assert.calledOnce(spy);
	},
	
	"test emit does not call subscriber with different topic": function () {
		var spy = sinon.spy();
		hub.on("a.b", spy);
		
		hub.emit("x.y");
		
		sinon.assert.notCalled(spy);
	},
	
	"test emit one argument": function () {
		var spy = sinon.spy();
		hub.on("x.y", spy);
		
		hub.emit("x.y", "first");
		
		sinon.assert.calledWith(spy, "first");
	},
	
	"test emit two arguments": function () {
		var spy = sinon.spy();
		hub.on("x.y", spy);
		
		hub.emit("x.y", "first", "second");
		
		sinon.assert.calledWith(spy, "first", "second");
	},
	
	"test emit on topic with two subscribers": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		hub.on("x.y", spy1);
		hub.on("x.y", spy2);

		hub.emit("x.y");

		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
		// First b, then a since second overrides first:
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test emit to two subscribers via wildcard message": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		hub.on("x.a", spy1);
		hub.on("x.b", spy2);
		hub.on("y.c", spy3);
		
		hub.emit("x.*");
		
		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
		sinon.assert.notCalled(spy3);
		// b overrides a:
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test emit to two subscribers via wildcard namespace": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		hub.on("x.a", spy1);
		hub.on("y.a", spy2);
		hub.on("z.b", spy3);
		
		hub.emit("*.a");

		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
		sinon.assert.notCalled(spy3);
		// y overrides x:
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test emit to wildcard, subscribe another, emit again": function () {
		var spy1 = sinon.spy();
		hub.on("x.a", spy1);
		hub.emit("x.*");
		
		sinon.assert.calledOnce(spy1);
		
		var spy2 = sinon.spy();
		hub.on("x.b", spy2);
		spy1.called = false;
		hub.emit("x.*");
		
		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
	},
	
	"test subscribe to wildcard": function () {
		var spy = sinon.spy();
		hub.on("x.*", spy);
		hub.emit("y.a");
		assertFalse(spy.called);
		hub.emit("x.a");
		
		sinon.assert.called(spy);
	},
	
	"test emit with placeholder in message": function () {
		var spy = sinon.spy();
		hub.on("x.y", spy);
		hub.emit("x.{0}", "y");
		
		sinon.assert.calledOnce(spy);
		
		hub.emit("x.{0.m}", {m: "y"});
		
		sinon.assert.calledTwice(spy);
	},
	
	"test subscribe emit subscribe same message": function () {
		var spy1 = sinon.spy();
		hub.on("x.y", spy1);
		hub.emit("x.y");
		
		sinon.assert.called(spy1);
		
		var spy2 = sinon.spy();
		hub.on("x.y", spy2);
		hub.emit("x.y");
		
		sinon.assert.calledTwice(spy1);
		sinon.assert.calledOnce(spy2);
	},
	
	"test subscribe emit subscribe same message w/ placeholder": function () {
		var spy1 = sinon.spy();
		hub.on("x.y", spy1);
		hub.emit("x.{0}", "y");
		
		sinon.assert.called(spy1);
		
		var spy2 = sinon.spy();
		hub.on("x.y", spy2);
		hub.emit("x.{0}", "y");
		
		sinon.assert.calledTwice(spy1);
		sinon.assert.called(spy2);
	},
	
	"test multicast emit and subscribe": function () {
		var spy = sinon.spy();
		hub.on("x.*", spy);
		hub.emit("x.*");
		
		sinon.assert.called(spy);
	},
	
	"test multicast subscriber invoked once": function () {
		var count = 0;
		var fn = function () {
			count++;
		};
		var fna = sinon.spy();
		var fnb = sinon.spy();
		hub.on("x.a", fna);
		hub.on("x.b", fnb);
		hub.on("x.*", fn);
		hub.emit("x.*");
		
		sinon.assert.called(fna);
		sinon.assert.called(fnb);
		assertEquals(1, count);
	},
	
	"test multicast emit twice": function () {
		var count = 0;
		var fn = function () {
			count++;
		};
		hub.on("x.a", fn);
		hub.emit("x.*");
		assertEquals(1, count);
		hub.emit("x.*");
		assertEquals(2, count);
	},
	
	"test throw in subscriber": function () {
		hub.on("test.throw", function () {
			throw new Error();
		});
		assertException(function () {
			hub.emit("test.throw");
		});
	}
	
});
