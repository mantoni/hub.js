/*
 * Test cases for Hub.util.substitute.
 */
TestCase("util_substitute", {
	
	"test function exists": function() {
		assertFunction(Hub.util.substitute);
	},
	
	"test substitute nothing": function() {
		assertEquals("the quick brown fox",
			Hub.util.substitute("the quick brown fox"));
	},
	
	"test substitute index from array": function() {
		assertEquals("hello index",
			Hub.util.substitute("hello {0}", ["index"]));
	},
	
	"test substitute key from object": function() {
		assertEquals("hello value",
			Hub.util.substitute("hello {key}", { key: "value" }));
	},
	
	"test substitute fallback": function() {
		assertEquals("hello fallback",
			Hub.util.substitute("hello {0}", null, "fallback"));
		assertEquals("hello fallback",
			Hub.util.substitute("hello {0}", {}, "fallback"));
	}
	
});
