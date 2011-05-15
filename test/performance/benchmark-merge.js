/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Benchmarks for Hub.merge.
 */
runBenchmark("Hub.merge", {
	
	'Hub.merge("test", undefined)': function (l) {
		for (var i = 0; i < l; i++) {
			Hub.merge("test", undefined);
		}
	},
	
	'Hub.merge(undefined, "test")': function (l) {
		for (var i = 0; i < l; i++) {
			Hub.merge(undefined, "test");
		}
	},
	
	'Hub.merge({}, {})': function (l) {
		for (var i = 0; i < l; i++) {
			Hub.merge({}, {});
		}
	},
	
	'Hub.merge([], [])': function (l) {
		for (var i = 0; i < l; i++) {
			Hub.merge([], []);
		}
	},
	
	'Hub.merge({}, []) + try-catch': function (l) {
		for (var i = 0; i < l; i++) {
			try {
				Hub.merge({}, []);
			}
			catch (e) {
				// exception is expected.
			}
		}
	},
	
	'Hub.merge(["foo"], ["bar"])': function (l) {
		for (var i = 0; i < l; i++) {
			Hub.merge(["foo"], ["bar"]);
		}
	},
	
	'Hub.merge({foo:"foo"}, {bar:"bar"})': function (l) {
		for (var i = 0; i < l; i++) {
			Hub.merge({foo:"foo"}, {bar:"bar"});
		}
	}
	
});