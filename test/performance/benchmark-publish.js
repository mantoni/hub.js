/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Benchmarks for hub.emit.
 */
runBenchmark("hub.emit", {
	
	'No subscribers - hub.emit("a.b")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.emit("a.b");
		}
	},
	
	'No subscribers - hub.emit("a.*")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.emit("a.*");
		}
	},
	
	'No subscribers - hub.emit("*.b")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.emit("*.b");
		}
	},
	
	'No subscribers - hub.emit("*.*")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.emit("*.*");
		}
	},
		
	'No subscribers - hub.emit("a.b", "hello")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.emit("a.b", "hello");
		}
	},

	'No subscribers - hub.emit("a.b", "hello", "world")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.emit("a.b", "hello", "world");
		}
	},

	'One empty subscriber - hub.emit("a.b")': function (l) {
		hub.on("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.emit("a.b");
		}
	},
	
	'One empty subscriber - hub.emit("a.*")': function (l) {
		hub.on("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.emit("a.*");
		}
	},
	
	'One empty subscriber - hub.emit("*.b")': function (l) {
		hub.on("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.emit("*.b");
		}
	},
	
	'One empty subscriber - hub.emit("*.*")': function (l) {
		hub.on("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.emit("*.*");
		}
	},
	
	'One empty subscriber - hub.emit("a.b", "hello")': function (l) {
		hub.on("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.emit("a.b", "hello");
		}
	},

	'One empty subscriber - hub.emit("a.b", "hello", "world")': function (l) {
		hub.on("a.b", function () {});
		for (var i = 0; i < l; i++) {
			hub.emit("a.b", "hello", "world");
		}
	}
	
});