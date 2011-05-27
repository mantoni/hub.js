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
 * Test cases for mixins.
 */
TestCase("MixinTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	/*
	 * in a parent-child relationship the child gets called
	 * first and the parent second. This follows the idea of
	 * overwriting.
	 */
	"test mixin call order": function () {
		var chain = [];
		hub.peer("parent", {
			"test": function () {
				chain.push("parent");
			}
		});
		hub.singleton("child", function () {
			this.mix("parent");
			return {
				test: function () {
					chain.push("child");
				}
			};
		});
		// child is called first, then the "super" implementation.
		hub.publish("child/test");
		assertEquals("child,parent", chain.join());
	},
	
	/*
	 * hub.stopPropagation() stops the propagation of the message
	 * in the current chain. So in this test case, the parents "test"
	 * is not invoked.
	 */
	"test stop propagation": function () {
		var chain = [];
		hub.peer("parent", {
			"test": function () {
				chain.push("parent");
			}
		});
		hub.singleton("child", function () {
			this.mix("parent");
			return {
				test: function () {
					chain.push("child");
					hub.stopPropagation();
				}
			};
		});
		hub.publish("child/test");
		assertEquals("child", chain.join());
	},
	
	/*
	 * hub.propagate() explicitly propagates the message to the
	 * next function in the call chain. This also means that the
	 * next function is not implicitly invoked afterwards anymore.
	 */
	"test propagate": function () {
		var chain = [];
		hub.peer("parent", {
			"test": function () {
				chain.push("parent");
			}
		});
		hub.singleton("child", function () {
			this.mix("parent");
			return {
				test: function () {
					hub.propagate();
					chain.push("child");
				}
			};
		});
		// explicit "super" invocation changes call order here.
		hub.publish("child/test");
		assertEquals("parent,child", chain.join());
	},
	
	"test unknown mixin throws error": function () {
		assertException(function () {
			hub.singleton("child", function () {
				this.mixin("parent");
			});
		});
	}

});