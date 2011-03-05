/*
 * Test cases for Hub.publisher.
 */
TestCase("publisher", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test function exists": function() {
		assertFunction(Hub.publisher);
	},
	
	"test publisher invocation": function() {
		var publisher = Hub.publisher("a/b");
		assertFunction(publisher);
		assertNoException(function() {
			publisher();
		});
		assertNoException(function() {
			publisher(null);
		});
		assertNoException(function() {
			publisher({});
		});
		assertNoException(function() {
			publisher([]);
		});
	},
	
	testSimpleForwarder: function() {
		var fn = Hub.publisher("a/b");
		assertEquals("function", typeof fn);
		assertEquals("data", this.publishData(fn, "data"));
	},
	
	testShortcut: function() {
		var fn = Hub.publisher("a/b");
		assertEquals("function", typeof fn);
		assertEquals("data", this.publishData(fn, "data"));
	},
	
	testMergeDataLong: function() {
		var fn = Hub.publisher("a/b", {x:"x"});
		var d = this.publishData(fn, {});
		assertEquals("x", d.x);
	},
	
	testMergeDataShort: function() {
		var fn = Hub.publisher("a/b", {x:"x"});
		var d = this.publishData(fn, {});
		assertEquals("x", d.x);
	},
		
	"test one function argument": function() {
		var fn = Hub.publisher("a/b", function(msg) { return msg + "!"; });
		assertEquals("Hi!", this.publishData(fn, "Hi"));
	},
	
	"test two function arguments": function() {
		var fn = Hub.publisher("a/b", function(msg1, msg2) {
			return msg1 + " " + msg2 + "!";
		});
		assertEquals("Hi there!", this.publishData(fn, "Hi", "there"));
	},
	
	"test merge of data and transform function": function() {
		var fn = Hub.publisher("a/b", function(data) {
			return { x: data };
		}, { y: "y" });
		var d = this.publishData(fn, "x");
		assertEquals("x", d.x);
		assertEquals("y", d.y);
	},
	
	publishData: function(fn) {
		var result;
		Hub.subscribe("a/b", function(data) {
			result = data;
		});
		fn.apply(null, Array.prototype.slice.call(arguments, 1));
		return result;
	}

});