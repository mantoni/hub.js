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
 * Test cases for publish and subscribe.
 */
TestCase("PublishSubscribeTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test publish calls subscriber with same topic": function () {
		var spy = sinon.spy();
		hub.subscribe("x.y", spy);
		
		hub.publish("x.y");
		
		sinon.assert.calledOnce(spy);
	},
	
	"test publish does not call subscriber with different topic": function () {
		var spy = sinon.spy();
		hub.subscribe("a.b", spy);
		
		hub.publish("x.y");
		
		sinon.assert.notCalled(spy);
	},
	
	"test publish one argument": function () {
		var spy = sinon.spy();
		hub.subscribe("x.y", spy);
		
		hub.publish("x.y", "first");
		
		sinon.assert.calledWith(spy, "first");
	},
	
	"test publish two arguments": function () {
		var spy = sinon.spy();
		hub.subscribe("x.y", spy);
		
		hub.publish("x.y", "first", "second");
		
		sinon.assert.calledWith(spy, "first", "second");
	},
	
	"test publish on topic with two subscribers": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		hub.subscribe("x.y", spy1);
		hub.subscribe("x.y", spy2);

		hub.publish("x.y");

		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
		// First b, then a since second overrides first:
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test publish to two subscribers via wildcard message": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		hub.subscribe("x.a", spy1);
		hub.subscribe("x.b", spy2);
		hub.subscribe("y.c", spy3);
		
		hub.publish("x.*");
		
		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
		sinon.assert.notCalled(spy3);
		// b overrides a:
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test publish to two subscribers via wildcard namespace": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		var spy3 = sinon.spy();
		hub.subscribe("x.a", spy1);
		hub.subscribe("y.a", spy2);
		hub.subscribe("z.b", spy3);
		
		hub.publish("*.a");

		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
		sinon.assert.notCalled(spy3);
		// y overrides x:
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test publish to wildcard, subscribe another, publish again": function () {
		var spy1 = sinon.spy();
		hub.subscribe("x.a", spy1);
		hub.publish("x.*");
		
		sinon.assert.calledOnce(spy1);
		
		var spy2 = sinon.spy();
		hub.subscribe("x.b", spy2);
		spy1.called = false;
		hub.publish("x.*");
		
		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
	},
	
	"test subscribe to wildcard": function () {
		var spy = sinon.spy();
		hub.subscribe("x.*", spy);
		hub.publish("y.a");
		assertFalse(spy.called);
		hub.publish("x.a");
		
		sinon.assert.called(spy);
	},
	
	"test publish with placeholder in message": function () {
		var spy = sinon.spy();
		hub.subscribe("x.y", spy);
		hub.publish("x.{0}", "y");
		
		sinon.assert.called(spy);
		
		spy.called = false;
		hub.publish("x.{0.m}", {m: "y"});
		
		sinon.assert.called(spy);
	},
	
	"test subscribe publish subscribe same message": function () {
		var spy1 = sinon.spy();
		hub.subscribe("x.y", spy1);
		hub.publish("x.y");
		sinon.assert.called(spy1);
		spy1.called = false;
		var spy2 = sinon.spy();
		hub.subscribe("x.y", spy2);
		hub.publish("x.y");
		
		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
	},
	
	"test subscribe publish subscribe same message w/ placeholder": function () {
		var spy1 = sinon.spy();
		hub.subscribe("x.y", spy1);
		hub.publish("x.{0}", "y");
		sinon.assert.called(spy1);
		spy1.called = false;
		var spy2 = sinon.spy();
		hub.subscribe("x.y", spy2);
		hub.publish("x.{0}", "y");
		
		sinon.assert.called(spy1);
		sinon.assert.called(spy2);
	},
	
	"test multicast publish and subscribe": function () {
		var spy = sinon.spy();
		hub.subscribe("x.*", spy);
		hub.publish("x.*");
		
		sinon.assert.called(spy);
	},
	
	"test multicast subscriber invoked once": function () {
		var count = 0;
		var fn = function () {
			count++;
		};
		var fna = sinon.spy();
		var fnb = sinon.spy();
		hub.subscribe("x.a", fna);
		hub.subscribe("x.b", fnb);
		hub.subscribe("x.*", fn);
		hub.publish("x.*");
		
		sinon.assert.called(fna);
		sinon.assert.called(fnb);
		assertEquals(1, count);
	},
	
	"test multicast publish twice": function () {
		var count = 0;
		var fn = function () {
			count++;
		};
		hub.subscribe("x.a", fn);
		hub.publish("x.*");
		assertEquals(1, count);
		hub.publish("x.*");
		assertEquals(2, count);
	},
	
	"test throw in subscriber": function () {
		hub.subscribe("test.throw", function () {
			throw new Error();
		});
		assertException(function () {
			hub.publish("test.throw");
		});
	}
	
});
