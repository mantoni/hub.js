/*
 * Benchmarks for Hub.publish.
 */
runBenchmark("Hub.publish", {
	
	'No subscribers - Hub.publish("a", "b")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("a", "b");
		}
	},
	
	'No subscribers - Hub.publish("a/b")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b");
		}
	},
	
	'No subscribers - Hub.publish("a", "*")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("a", "*");
		}
	},
	
	'No subscribers - Hub.publish("*", "b")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("*", "b");
		}
	},
	
	'No subscribers - Hub.publish("*", "*")': function(l) {
		for(var i = 0; i < l; i++) {
			Hub.publish("*", "*");
		}
	},
	
	'One empty subscriber - Hub.publish("a", "b")': function(l) {
		Hub.subscribe("a", "b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("a", "b");
		}
	},
	
	'One empty subscriber - Hub.publish("a/b")': function(l) {
		Hub.subscribe("a", "b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("a/b");
		}
	},
	
	'One empty subscriber - Hub.publish("a", "*")': function(l) {
		Hub.subscribe("a", "b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("a", "*");
		}
	},
	
	'One empty subscriber - Hub.publish("*", "b")': function(l) {
		Hub.subscribe("a", "b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("*", "b");
		}
	},
	
	'One empty subscriber - Hub.publish("*", "*")': function(l) {
		Hub.subscribe("a", "b", function() {});
		for(var i = 0; i < l; i++) {
			Hub.publish("*", "*");
		}
	}
	
});