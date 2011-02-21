/*
 * Test cases for Hub.forward.
 */
TestCase("forward", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testSimpleForwardLong: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.forward("a", "b", "x", "y");
		Hub.publish("a", "b");
		assertTrue(called);
	},

	testSimpleForwardShort: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.forward("a/b", "x/y");
		Hub.publish("a", "b");
		assertTrue(called);
	},
	
	testSimpleForwardShortAndLong: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.forward("a/b", "x", "y");
		Hub.publish("a", "b");
		assertTrue(called);
	},
	
	testSimpleForwardLongAndShort: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.forward("a", "b", "x/y");
		Hub.publish("a", "b");
		assertTrue(called);
	},
	
	testMultiForwardSimple: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.forward({
			"a/b": "x/y"
		});
		Hub.publish("a", "b");
		assertTrue(called);
	},
	
	testMultiForwardComplex: function() {
		var called = false;
		Hub.subscribe("x", "y", function() {
			called = true;
		});
		Hub.forward({
			"a/b": ["x", "y"]
		});
		Hub.publish("a", "b");
		assertTrue(called);
	}

});