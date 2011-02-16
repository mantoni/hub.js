/*
 * Test cases for Hub.unsubscribe.
 */
TestCase("unsubscribe", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * basic unsubscribe functionality.
	 */
	testSimpleUnsubscribe: function() {
		var called = false;
		var fn = function() {
			called = true;
		};
		Hub.subscribe("x", "y", fn);
		Hub.publish("x", "y");
		assertTrue(called);
		called = false;
		Hub.unsubscribe("x", "y", fn);
		Hub.publish("x", "y");
		assertFalse(called);
	},
	
	testUnsubscribeFirstInChainOfTwo: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		Hub.subscribe("x", "y", f1);
		Hub.subscribe("x", "y", f2);
		Hub.publish("x", "y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x", "y", f1);
		Hub.publish("x", "y");
		assertEquals("f2", a.join());
	},
	
	testUnsubscribeSecondInChainOfTwo: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		Hub.subscribe("x", "y", f1);
		Hub.subscribe("x", "y", f2);
		Hub.publish("x", "y");
		assertEquals("f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x", "y", f2);
		Hub.publish("x", "y");
		assertEquals("f1", a.join());
	},
	
	testUnsubscribeFirstInChainOfThree: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		var f3 = function() {
			a.push("f3");
		};
		Hub.subscribe("x", "y", f1);
		Hub.subscribe("x", "y", f2);
		Hub.subscribe("x", "y", f3);
		Hub.publish("x", "y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x", "y", f1);
		Hub.publish("x", "y");
		assertEquals("f3,f2", a.join());
	},
	
	testUnsubscribeSecondInChainOfThree: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		var f3 = function() {
			a.push("f3");
		};
		Hub.subscribe("x", "y", f1);
		Hub.subscribe("x", "y", f2);
		Hub.subscribe("x", "y", f3);
		Hub.publish("x", "y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x", "y", f2);
		Hub.publish("x", "y");
		assertEquals("f3,f1", a.join());
	},
	
	testUnsubscribeThirdInChainOfThree: function() {
		var a = [];
		var f1 = function() {
			a.push("f1");
		};
		var f2 = function() {
			a.push("f2");
		};
		var f3 = function() {
			a.push("f3");
		};
		Hub.subscribe("x", "y", f1);
		Hub.subscribe("x", "y", f2);
		Hub.subscribe("x", "y", f3);
		Hub.publish("x", "y");
		assertEquals("f3,f2,f1", a.join());
		a.length = 0;
		Hub.unsubscribe("x", "y", f3);
		Hub.publish("x", "y");
		assertEquals("f2,f1", a.join());
	}

});