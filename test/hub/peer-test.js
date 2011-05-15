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
 * Test cases for Hub.peer.
 */
TestCase("PeerTest", {
	
	tearDown: function () {
		Hub.reset();
	},
	
	"test should fail if defined twice": function () {
		Hub.peer("definedTwice", {});
		try {
			Hub.peer("definedTwice", {});
		} catch (e) {
			assertEquals("Hub - peer already defined: definedTwice",
				e.message);
			return;
		}
		fail("Exception expected");
	},
	
	"test should receive message": function () {
		var fn = stubFn();
		Hub.peer("simple", {
			"message": fn
		});
		Hub.publish("simple/message");
		assert(fn.called);
	},
	
	"test should allow dot separated namespace and message": function () {
		var fn = stubFn();
		Hub.peer("a.b", {
			"c.d": fn
		});
		Hub.publish("a.b/c");
		assertFalse(fn.called);
		Hub.publish("a.b/c.d");
		assert(fn.called);
	},
	
	/*
	 * ensure a peer can be defined after an existing subscription and both
	 * get mixed and then invoked in the correct order.
	 */
	"test should override subscriber": function () {
		var chain = [];
		Hub.subscribe("a/b", function () {
			chain.push("subscribe");
		});
		Hub.peer("a", {
			"b": function () {
				chain.push("peer");
			}
		});
		Hub.publish("a/b");
		// "peer" first, because it was added last.
		assertEquals("peer,subscribe", chain.join());
	},
	
	"test should receive multicast": function () {
		var chain = [];
		Hub.peer("a.b", {
			"m": function () {
				chain.push("x");
			}
		});
		Hub.peer("a.c", {
			"m": function () {
				chain.push("y");
			}
		});
		Hub.publish("a.*/m");
		// "y" first, because it was added last.
		assertEquals("y,x", chain.join());
	},
	
	"test should receive message with peer as scope object": function () {
		var fn = stubFn();
		Hub.peer("a", {
			"b": fn
		});
		Hub.publish("a/b");
		assertSame(Hub.get("a"), fn.scope);
	}

});