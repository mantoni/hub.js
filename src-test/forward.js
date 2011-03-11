/*
 * Test cases for Hub.forward.
 */
TestCase("forward", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testSimpleForwardShort: function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward("a/b", "x/y");
		Hub.publish("a/b");
		assertTrue(fn.called);
	},
	
	testMultiForwardSimple: function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward({
			"a/b": "x/y"
		});
		Hub.publish("a/b");
		assertTrue(fn.called);
	},
	
	testMultiForwardComplex: function() {
		var fn = stubFn();
		Hub.subscribe("x/y", fn);
		Hub.forward({
			"a/b": ["x/y"]
		});
		Hub.publish("a/b");
		assertTrue(fn.called);
	}

});