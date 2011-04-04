/*
 * Benchmarks for Hub.util.merge.
 */
runBenchmark("Hub.util.merge", {
	
	'Hub.util.merge("test", undefined)': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.util.merge("test", undefined);
		}
	},
	
	'Hub.util.merge(undefined, "test")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.util.merge(undefined, "test");
		}
	},
	
	'Hub.util.merge({}, {})': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.util.merge({}, {});
		}
	},
	
	'Hub.util.merge([], [])': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.util.merge([], []);
		}
	},
	
	'Hub.util.merge({}, []) + try-catch': function(l) {
		for(var i = 0; i < l; i++) {
			try {
				Hub.util.merge({}, []);
			}
			catch(e) {
				// exception is expected.
			}
		}
	},
	
	'Hub.util.merge(["foo"], ["bar"])': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.util.merge(["foo"], ["bar"]);
		}
	},
	
	'Hub.util.merge({foo:"foo"}, {bar:"bar"})': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.util.merge({foo:"foo"}, {bar:"bar"});
		}
	}
	
});