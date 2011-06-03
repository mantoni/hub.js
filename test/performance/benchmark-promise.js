/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Benchmarks for hub.promise.
 */
runBenchmark("hub.promise", {
	
	'hub.promise()': function (l) {
		for (var i = 0; i < l; i++) {
			hub.promise();
		}
	},
	
	'hub.promise() from within listener': function (l) {
		hub.subscribe("a.b", function () {
			hub.promise();
		});
		for (var i = 0; i < l; i++) {
			hub.publish("a.b");
		}
	}
	
});