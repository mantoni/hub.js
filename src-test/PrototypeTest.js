/*
 * Test cases for prototype scoped peers.
 */
TestCase("PrototypeTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test publish message to prototype peer": function() {
		var fn = stubFn();
		Hub.peer("test", function() {
			return {
				stub: fn
			};
		});
		Hub.publish("test/stub");
		assert(fn.called);
	},
	
	"test subscriber for prototype peer": function() {
		var fn = stubFn();
		Hub.peer("test", function() {
			return {
				stub: fn
			};
		});
		Hub.publisher("test/stub")();
		assert(fn.called);
	},
	
	"test publish and then": function() {
		var fn1 = stubFn("returned");
		Hub.peer("test", function() {
			return {
				stub: fn1
			};
		});
		var fn2 = stubFn();
		Hub.publish("test/stub").then(fn2);
		assert(fn1.called);
		assert(fn2.called);
		assertEquals(["returned"], fn2.args);
	}
	
});