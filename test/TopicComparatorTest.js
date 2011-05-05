/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.topicComparator.
 */
TestCase("TopicComparatorTest", {
	
	"test method exists": function() {
		assertFunction(Hub.topicComparator);
	},
	
	"test equal": function() {
		assertEquals(0, Hub.topicComparator("foo", "bar"));
	},
	
	"test wildcard message": function() {
		assertEquals(-1, Hub.topicComparator("foo/*", "foo/bar"));
		assertEquals(1, Hub.topicComparator("foo/bar", "foo/*"));
	},

	"test wildcard namespace": function() {
		assertEquals(-1, Hub.topicComparator("*/bar", "foo/bar"));
		assertEquals(1, Hub.topicComparator("foo/bar", "*/bar"));
	},

	"test namespace before message": function() {
		assertEquals(-1, Hub.topicComparator("*/foo", "foo/*"));
		assertEquals(1, Hub.topicComparator("foo/*", "*/foo"));
	},

	"test namespace before message": function() {
		assertEquals(-1, Hub.topicComparator("*/foo", "foo/*"));
		assertEquals(1, Hub.topicComparator("foo/*", "*/foo"));
	}

	
});