/*
 * Benchmarks for Hub.promise.
 */
runBenchmark("Hub.promise", {
	
	'Hub.promise()': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.promise();
		}
	},
	
	'Hub.promise() from within listener': function(l) {
		Hub.subscribe("a/b", function() {
			Hub.promise();
		});
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b");
		}
	}
	
});