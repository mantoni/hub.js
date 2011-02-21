/*
 * Test cases for Hub.forwarder.
 */
TestCase("forwarder", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testSimpleForwarder: function() {
		var fn = Hub.forwarder("a", "b");
		assertEquals("function", typeof fn);
		assertEquals("data", this.forwardData(fn, "data"));
	},
	
	testShortcut: function() {
		var fn = Hub.forwarder("a/b");
		assertEquals("function", typeof fn);
		assertEquals("data", this.forwardData(fn, "data"));
	},
	
	testMergeDataLong: function() {
		var fn = Hub.forwarder("a", "b", {x:"x"});
		var d = this.forwardData(fn, {});
		assertEquals("x", d.x);
	},
	
	testMergeDataShort: function() {
		var fn = Hub.forwarder("a/b", {x:"x"});
		var d = this.forwardData(fn, {});
		assertEquals("x", d.x);
	},
	
	testDataFunctionLong: function() {
		var fn = Hub.forwarder("a", "b", function(data) { return data + "!"; });
		assertEquals("Hi!", this.forwardData(fn, "Hi"));
	},
	
	testDataFunctionShort: function() {
		var fn = Hub.forwarder("a/b", function(data) { return data + "!"; });
		assertEquals("Hi!", this.forwardData(fn, "Hi"));
	},
	
	testMergeDataAndFunctionLong: function() {
		var fn = Hub.forwarder("a", "b", function(data) { return { x: data } }, { y: "y" });
		var d = this.forwardData(fn, "x");
		assertEquals("x", d.x);
		assertEquals("y", d.y);
	},
	
	testMergeDataAndFunctionShort: function() {
		var fn = Hub.forwarder("a/b", function(data) { return { x: data } }, { y: "y" });
		var d = this.forwardData(fn, "x");
		assertEquals("x", d.x);
		assertEquals("y", d.y);
	},
	
	forwardData: function(fn, d) {
		var result;
		Hub.subscribe("a", "b", function(data) {
			result = data;
		});
		fn(d);
		return result;
	}

});