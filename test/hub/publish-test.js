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
 * Test cases for hub.publish.
 */
(function () {

	function assertInvoked(topic, fn) {
		hub.publish(topic);
		assert(topic, fn.called);
		fn.called = false;
	}
	
	function assertNotInvoked(topic, fn) {
		hub.publish(topic);
		assertFalse(topic, fn.called);
	}
	
	TestCase("PublishTest", {
	
		tearDown: function () {
			hub.reset();
		},
	
		"test should implement publish": function () {
			assertFunction(hub.publish);
		},
	
		"test should throw if topic is not string": function () {
			assertException(function () {
				hub.publish(null);
			});
			assertException(function () {
				hub.publish(undefined);
			});
			assertException(function () {
				hub.publish(false);
			});
			assertException(function () {
				hub.publish(true);
			});
			assertException(function () {
				hub.publish({});
			});
			assertException(function () {
				hub.publish([]);
			});
			assertException(function () {
				hub.publish(77);
			});
		},
	
		"test should throw if topic is empty": function () {
			assertException(function () {
				hub.publish("");
			});
		},
	
		"test should throw if topic is invalid": function () {
			assertException(function () {
				hub.publish("foo/bar/doo");
			});
			assertException(function () {
				hub.publish("foo /doo");
			});
			assertException(function () {
				hub.publish("foo:doo");
			});
		},
	
		"test should not throw if topic is valid": function () {
			assertNoException(function () {
				hub.publish("a");
			});
			assertNoException(function () {
				hub.publish("a/b");
			});
			assertNoException(function () {
				hub.publish("a/*");
			});
			assertNoException(function () {
				hub.publish("*/b");
			});
			assertNoException(function () {
				hub.publish("a.*/b");
			});
			assertNoException(function () {
				hub.publish("a/b.*");
			});
			assertNoException(function () {
				hub.publish("a.*/b.*");
			});
			assertNoException(function () {
				hub.publish("*.a/b");
			});
			assertNoException(function () {
				hub.publish("*.a/*.b");
			});
			assertNoException(function () {
				hub.publish("**/b");
			});
			assertNoException(function () {
				hub.publish("a/**");
			});
		},
	
		"test should find matching subscriber for wildcards": function () {
			var fn = sinon.spy();
			hub.subscribe("a.b/c.d", fn);
			assertInvoked("a.b/c.*", fn);
			assertInvoked("a.b/c.**", fn);
			assertNotInvoked("a.b/*", fn);
			assertInvoked("a.b/**", fn);
			assertInvoked("a.*/c.d", fn);
			assertInvoked("a.**/c.d", fn);
			assertNotInvoked("*/c.d", fn);
			assertInvoked("**/c.d", fn);
		}

	});

}());