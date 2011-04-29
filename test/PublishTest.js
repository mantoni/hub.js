/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.publish.
 */
TestCase("PublishTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test function exists": function() {
		assertFunction(Hub.publish);
	},
	
	"test topic must be string": function() {
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
	
	"test topic cannot be empty": function() {
		assertException(function() {
			Hub.publish("");
		});
	},
	
	"test illegal topic": function() {
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
	
	"test legal topic": function() {
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
	
	"test publish wildcards": function() {
		var fn = stubFn();
		Hub.subscribe("a.b/c.d", fn);
		this.assertInvoked("a.b/c.*", fn);
		this.assertInvoked("a.b/c.**", fn);
		this.assertNotInvoked("a.b/*", fn);
		this.assertInvoked("a.b/**", fn);
		this.assertInvoked("a.*/c.d", fn);
		this.assertInvoked("a.**/c.d", fn);
		this.assertNotInvoked("*/c.d", fn);
		this.assertInvoked("**/c.d", fn);
	},
	
	assertInvoked: function(topic, fn) {
		Hub.publish(topic);
		assertTrue(topic, fn.called);
		fn.called = false;
	},
	
	assertNotInvoked: function(topic, fn) {
		Hub.publish(topic);
		assertFalse(topic, fn.called);
	}

});