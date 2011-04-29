/*
 * Test cases for Hub.forward.
 */
TestCase("ForwardTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test simple forward short": function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward("a/b", "x/y");
		Hub.publish("a/b");
		assert(fn.called);
	},
	
	"test multi forward simple": function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward({
			"a/b": "x/y"
		});
		Hub.publish("a/b");
		assert(fn.called);
	},
	
	testMultiForwardComplex: function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward({
			"a/b": ["x/y"]
		});
		Hub.publish("a/b");
		assert(fn.called);
	}

});