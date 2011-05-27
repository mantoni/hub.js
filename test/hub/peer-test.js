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
	
	"test should fail if defined twice": function () {
		hub.peer("definedTwice", {});
		
		assertException(function () {
			hub.peer("definedTwice", {});
		});
	},
	
	"test should receive message": function () {
		var spy = sinon.spy();
		hub.peer("simple", {
			"message": spy
		});
		
		hub.publish("simple/message");
		
		sinon.assert.calledOnce(spy);
	},
	
	"test should allow dot separated namespace and message": function () {
		var spy = sinon.spy();
		hub.peer("a.b", {
			"c.d": spy
		});
		
		hub.publish("a.b/c");
		
		sinon.assert.notCalled(spy);
		hub.publish("a.b/c.d");
		sinon.assert.calledOnce(spy);
	},
	
	/*
	 * ensure a peer can be defined after an existing subscription and both
	 * get mixed and then invoked in the correct order.
	 */
	"test should override subscriber": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		hub.subscribe("a/b", spy1);
		hub.peer("a", {
			"b": spy2
		});
		
		hub.publish("a/b");

		// "peer" first, because it was added last.
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test should receive multicast": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		hub.peer("a.b", {
			"m": spy1
		});
		hub.peer("a.c", {
			"m": spy2
		});
		
		hub.publish("a.*/m");
		
		// "y" first, because it was added last.
		sinon.assert.callOrder(spy2, spy1);
	},
	
	"test should receive message with peer as scope object": function () {
		var spy = sinon.spy();
		hub.peer("a", {
			"b": spy
		});
		
		hub.publish("a/b");
		
		sinon.assert.calledOn(spy, hub.get("a"));
	},
	
	"test should publish create notification message": function () {
		var spy = sinon.spy();
		hub.subscribe("hub.peer.new/a", spy);

		hub.peer("a", {
			b: function () {}
		});
		
		sinon.assert.calledOnce(spy);
		assertFunction(spy.getCall(0).args[0].b);
	}
	
});

TestCase("PeerMixTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should use hub.object": sinon.test(function () {
		this.stub(hub, "object").returns({});
		
		hub.peer("a", function () {});
		hub.get("a");
		
		sinon.assert.calledOnce(hub.object);
		sinon.assert.calledWith(hub.object, "a");
	}),
	
	"test should override existing message": function () {
		var spy1 = sinon.spy();
		var spy2 = sinon.spy();
		hub.peer("a", {
			m: spy1
		});
		hub.peer("b", function () {
			this.mix("a");
			return {
				m: spy2
			};
		});
		
		hub.get("b").m();
		
		sinon.assert.calledOnce(spy1);
		sinon.assert.calledOnce(spy2);
		sinon.assert.callOrder(spy2, spy1);
	}

});
