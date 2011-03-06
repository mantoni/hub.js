/*
 * Test cases for prototype scoped peers.
 */
TestCase("prototype", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test publish message to prototype peer": function() {
		var fn = stubFn();
		Hub.peer("test", {
			scope: Hub.PROTOTYPE
		},
		function() {
			return {
				stub: fn
			};
		});
		Hub.publish("test/stub");
		assert(fn.called);
	},
	
	"test subscriber for prototype peer": function() {
		var fn = stubFn();
		Hub.peer("test", {
			scope: Hub.PROTOTYPE
		},
		function() {
			return {
				stub: fn
			};
		});
		Hub.publisher("test/stub")();
		assert(fn.called);
	}
	
});