/*jslint undef: true*/
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
 * Test cases for Hub.publish.
 */
(function() {

	function assertInvoked(topic, fn) {
		Hub.publish(topic);
		assert(topic, fn.called);
		fn.called = false;
	}
	
	function assertNotInvoked(topic, fn) {
		Hub.publish(topic);
		assertFalse(topic, fn.called);
	}
	
	TestCase("PublishTest", {
	
		tearDown: function() {
			Hub.reset();
		},
	
		"test should implement publish": function() {
			assertFunction(Hub.publish);
		},
	
		"test should throw if topic is not string": function() {
			assertException(function() {
				Hub.publish(null);
			});
			assertException(function() {
				Hub.publish(undefined);
			});
			assertException(function() {
				Hub.publish(false);
			});
			assertException(function() {
				Hub.publish(true);
			});
			assertException(function() {
				Hub.publish({});
			});
			assertException(function() {
				Hub.publish([]);
			});
			assertException(function() {
				Hub.publish(77);
			});
		},
	
		"test should throw if topic is empty": function() {
			assertException(function() {
				Hub.publish("");
			});
		},
	
		"test should throw if topic is invalid": function() {
			assertException(function() {
				Hub.publish("foo/bar/doo");
			});
			assertException(function() {
				Hub.publish("foo /doo");
			});
			assertException(function() {
				Hub.publish("foo:doo");
			});
		},
	
		"test should not throw if topic is valid": function() {
			assertNoException(function() {
				Hub.publish("a");
			});
			assertNoException(function() {
				Hub.publish("a/b");
			});
			assertNoException(function() {
				Hub.publish("a/*");
			});
			assertNoException(function() {
				Hub.publish("*/b");
			});
			assertNoException(function() {
				Hub.publish("a.*/b");
			});
			assertNoException(function() {
				Hub.publish("a/b.*");
			});
			assertNoException(function() {
				Hub.publish("a.*/b.*");
			});
			assertNoException(function() {
				Hub.publish("*.a/b");
			});
			assertNoException(function() {
				Hub.publish("*.a/*.b");
			});
			assertNoException(function() {
				Hub.publish("**/b");
			});
			assertNoException(function() {
				Hub.publish("a/**");
			});
		},
	
		"test should find matching subscriber for wildcards": function() {
			var fn = stubFn();
			Hub.subscribe("a.b/c.d", fn);
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