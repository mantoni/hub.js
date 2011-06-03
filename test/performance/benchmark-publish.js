/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Benchmarks for hub.publish.
 */
runBenchmark("hub.publish", {
	
	'No subscribers - hub.publish("a.b")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.publish("a.b");
		}
	},
	
	'No subscribers - hub.publish("a.*")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.publish("a.*");
		}
	},
	
	'No subscribers - hub.publish("*.b")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.publish("*.b");
		}
	},
	
	'No subscribers - hub.publish("*.*")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.publish("*.*");
		}
	},
		
	'No subscribers - hub.publish("a.b", "hello")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.publish("a.b", "hello");
		}
	},

	'No subscribers - hub.publish("a.b", "hello", "world")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.publish("a.b", "hello", "world");
		}
	},

	'One empty subscriber - hub.publish("a.b")': function (l) {
		hub.subscribe("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.publish("a.b");
		}
	},
	
	'One empty subscriber - hub.publish("a.*")': function (l) {
		hub.subscribe("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.publish("a.*");
		}
	},
	
	'One empty subscriber - hub.publish("*.b")': function (l) {
		hub.subscribe("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.publish("*.b");
		}
	},
	
	'One empty subscriber - hub.publish("*.*")': function (l) {
		hub.subscribe("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.publish("*.*");
		}
	},
	
	'One empty subscriber - hub.publish("a.b", "hello")': function (l) {
		hub.subscribe("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.publish("a.b", "hello");
		}
	},

	'One empty subscriber - hub.publish("a.b", "hello", "world")': function (l) {
		hub.subscribe("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.publish("a.b", "hello", "world");
		}
	}
	
});