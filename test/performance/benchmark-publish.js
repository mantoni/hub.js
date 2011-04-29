/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Benchmarks for Hub.publish.
 */
runBenchmark("Hub.publish", {
	
	'No subscribers - Hub.publish("a/b")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b");
		}
	},
	
	'No subscribers - Hub.publish("a/*")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("a/*");
		}
	},
	
	'No subscribers - Hub.publish("*/b")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("*/b");
		}
	},
	
	'No subscribers - Hub.publish("*/*")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("*/*");
		}
	},
		
	'No subscribers - Hub.publish("a/b", "hello")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b", "hello");
		}
	},

	'No subscribers - Hub.publish("a/b", "hello", "world")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b", "hello", "world");
		}
	},

	'One empty subscriber - Hub.publish("a/b")': function(l) {
		Hub.subscribe("a/b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b");
		}
	},
	
	'One empty subscriber - Hub.publish("a/*")': function(l) {
		Hub.subscribe("a/b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("a/*");
		}
	},
	
	'One empty subscriber - Hub.publish("*/b")': function(l) {
		Hub.subscribe("a/b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("*/b");
		}
	},
	
	'One empty subscriber - Hub.publish("*/*")': function(l) {
		Hub.subscribe("a/b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("*/*");
		}
	},
	
	'One empty subscriber - Hub.publish("a/b", "hello")': function(l) {
		Hub.subscribe("a/b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b", "hello");
		}
	},

	'One empty subscriber - Hub.publish("a/b", "hello", "world")': function(l) {
		Hub.subscribe("a/b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b", "hello", "world");
		}
	}
	
});