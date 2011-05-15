/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Benchmarks for hub.merge.
 */
runBenchmark("hub.merge", {
	
	'hub.merge("test", undefined)': function (l) {
		for (var i = 0; i < l; i++) {
			hub.merge("test", undefined);
		}
	},
	
	'hub.merge(undefined, "test")': function (l) {
		for (var i = 0; i < l; i++) {
			hub.merge(undefined, "test");
		}
	},
	
	'hub.merge({}, {})': function (l) {
		for (var i = 0; i < l; i++) {
			hub.merge({}, {});
		}
	},
	
	'hub.merge([], [])': function (l) {
		for (var i = 0; i < l; i++) {
			hub.merge([], []);
		}
	},
	
	'hub.merge({}, []) + try-catch': function (l) {
		for (var i = 0; i < l; i++) {
			try {
				hub.merge({}, []);
			}
			catch (e) {
				// exception is expected.
			}
		}
	},
	
	'hub.merge(["foo"], ["bar"])': function (l) {
		for (var i = 0; i < l; i++) {
			hub.merge(["foo"], ["bar"]);
		}
	},
	
	'hub.merge({foo:"foo"}, {bar:"bar"})': function (l) {
		for (var i = 0; i < l; i++) {
			hub.merge({foo:"foo"}, {bar:"bar"});
		}
	}
	
});