/*
 * Test cases for Hub.util.resolve.
 */
TestCase("util_resolve", {
	
	"test function exists": function() {
		assertFunction(Hub.util.resolve);
	},

	"test resolve undefined": function() {
		assertUndefined(Hub.util.resolve({}, "foo"));
	},
	
	"test resolve index from array": function() {
		assertEquals("foo", Hub.util.resolve(["foo"], "0"));
	},
	
	"test resolve property from object": function() {
		assertEquals("foo", Hub.util.resolve({ x: "foo" }, "x"));
	},
	
	"test resolve property path from array": function() {
		assertEquals("foo", Hub.util.resolve([{ x: "foo" }], "0.x"));
	},
	
	"test resolve property path from object": function() {
		assertEquals("foo", Hub.util.resolve({ x: { y: "foo" } }, "x.y"));
	},
	
	"test resolve illegal path": function() {
		assertUndefined(Hub.util.resolve({}, "x.y"));
	},
	
	"test resolve default value": function() {
		assertEquals("nothing 1", Hub.util.resolve({}, "x", "nothing 1"));
		assertEquals("nothing 2", Hub.util.resolve({}, "x.y", "nothing 2"));
	}
	
});
