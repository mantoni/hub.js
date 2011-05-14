/*jslint undef: true*/
/*globals Hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for Hub.iterator.
 */
TestCase("IteratorTest", {

	"test method exists": function() {
		assertFunction(Hub.iterator);
	},
	
	"test iterator returns function": function() {
		assertFunction(Hub.iterator([]));
	},
		
	"test hasNext is false for empty array": function() {
		assertFalse(Hub.iterator([]).hasNext);
	},
	
	"test hasNext is true for array with one element": function() {
		assert(Hub.iterator([null]).hasNext);
	},
	
	"test throws error if no argument": function() {
		assertException(function() {
			Hub.iterator();
		});
	},
	
	"test iterator returns first array element": function() {
		var value = {};
		assertSame(value, Hub.iterator([value])());
	},
	
	"test hasNext changes to false after one call": function() {
		var i = Hub.iterator([null]);
		i();
		assertFalse(i.hasNext);
	},
	
	"test hasNext changes to false after two calls": function() {
		var i = Hub.iterator([null, null]);
		i();
		i();
		assertFalse(i.hasNext);
	},
	
	"test iterator out of bounds": function() {
		var i = Hub.iterator([]);
		assertException(i);
	},
	
	"test iterator implements remove": function() {
		assertFunction(Hub.iterator([]).remove);
	},
	
	"test hasNext is false after remove": function() {
		var i = Hub.iterator([null]);
		i.remove();
		assertFalse(i.hasNext);
	},
	
	"test remove current index": function() {
		var arr = [0, 1, 2, 3];
		var i = Hub.iterator(arr);
		i();
		i.remove();
		assertEquals([0, 2, 3], arr);
	},
	
	"test remove with index": function() {
		var arr = [0, 1, 2, 3];
		Hub.iterator(arr).remove(2);
		assertEquals([0, 1, 3], arr);
	},
	
	"test remove with value": function() {
		var arr = ["a", "b"];
		Hub.iterator(arr).remove("b");
		assertEquals(["a"], arr);
	},
	
	"test remove returns true if found": function() {
		assert(Hub.iterator(["a"]).remove("a"));
	},
	
	"test remove returns false if not found": function() {
		assertFalse(Hub.iterator(["a"]).remove("b"));
	},
	
	"test remove returns false if no next": function() {
		assertFalse(Hub.iterator([]).remove());
	},
	
	"test remove with current index": function() {
		this.assertValueAfterRemove(1, 2);
	},
	
	"test remove with previous index": function() {
		this.assertValueAfterRemove(0, 2);
	},
	
	"test remove with next index": function() {
		this.assertValueAfterRemove(2, 3);
	},
	
	assertValueAfterRemove: function(index, value) {
		var arr = [0, 1, 2, 3];
		var i = Hub.iterator(arr);
		i();
		i();
		i.remove(index);
		assertEquals(value, i());
	},
	
	"test iterator implements insert": function() {
		assertFunction(Hub.iterator([]).insert);
	},
	
	"test insert changes hasNext to true": function() {
		var i = Hub.iterator([]);
		i.insert({});
		assert(i.hasNext);
	},
	
	"test inserted item is returned": function() {
		var value = {};
		var i = Hub.iterator([]);
		i.insert(value);
		assertSame(value, i());
	},
	
	"test insert at current position": function() {
		var arr = [0, 1, 2, 3];
		var i = Hub.iterator(arr);
		i();
		i();
		i.insert(4);
		assertEquals([0, 1, 4, 2, 3], arr);
	},
	
	"test insert at specific position": function() {
		var arr = [0, 1, 2, 3];
		var i = Hub.iterator(arr);
		i.insert(3, 4);
		assertEquals([0, 1, 2, 4, 3], arr);
	},
	
	"test insert at current index": function() {
		var arr = [0, 1, 2];
		var i = Hub.iterator(arr);
		i();
		i.insert(1, 3);
		assertEquals(3, i());
	},
	
	"test insert before current index": function() {
		var arr = [0, 1, 2];
		var i = Hub.iterator(arr);
		i();
		i.insert(0, 3);
		assertEquals(1, i());
	},
	
	"test insert after current index": function() {
		var arr = [0, 1, 2];
		var i = Hub.iterator(arr);
		i();
		i.insert(2, 3);
		assertEquals(1, i());
	},
	
	"test implements reset": function() {
		assertFunction(Hub.iterator([]).reset);
	},
	
	"test points to first item after reset": function() {
		var i = Hub.iterator([0, 1]);
		i();
		i();
		assertFalse(i.hasNext);
		i.reset();
		assert(i.hasNext);
		assertEquals(0, i());
	}

});
