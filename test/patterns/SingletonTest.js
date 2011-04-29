/*
 * Test cases for the singleton pattern.
 */
TestCase("SingletonTest", {
	
	tearDown: function() {
		Hub.reset();
	},

	"test singleton object": function() {
		var fn = stubFn();
		Hub.peer("singleton", {
			method: fn
		});
		Hub.publish("singleton/method");
		assert(fn.called);
	},

	"test singleton module": function() {
		var fn = stubFn();
		Hub.peer("singleton", (function() {
			// private variables go here.
			return {
				method: fn
			};
		}()));
		Hub.publish("singleton/method");
		assert(fn.called);
	}

});