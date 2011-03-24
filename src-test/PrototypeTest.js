/*
 * Test cases for prototype scoped peers.
 */
TestCase("PrototypeTest", {
	
	setUp: function() {
		this.fn = stubFn();
		Hub.peer("test", function() {
			return {
				stub: fn
			};
		});
	},
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test publish does not invoke method on prototype peer": function() {
		Hub.publish("test/stub");
		assertFalse(this.fn.called);
	},
	
	"test publisher does not invoke method on prototype peer": function() {
		Hub.publisher("test/stub")();
		assertFalse(this.fn.called);
	}
	
});