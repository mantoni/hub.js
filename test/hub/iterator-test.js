/*jslint undef: true, white: true*/
/*globals hub sinon TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.iterator.
 */
TestCase("IteratorTest", {

	"test should implement iterator": function () {
		assertFunction(hub.iterator);
	},

	"test should return function": function () {
		var iterator = hub.iterator([]);
		
		assertFunction(iterator);
	},
		
	"test should throw if no arguments provided": function () {
		assertException(function () {
			hub.iterator();
		});
	},

	"test should return first array element when invoked": function () {
		var value = {};
		var iterator = hub.iterator([value]);
		
		var result = iterator();
		
		assertSame(value, result);
	},

	"test should throw if out of bounds": function () {
		var iterator = hub.iterator([]);
		
		assertException(function () {
			iterator();
		});
	}
	
});

TestCase("IteratorHasNextTest", {
	
	"test should be false for empty array": function () {
		var iterator = hub.iterator([]);
		
		assertFalse(iterator.hasNext);
	},

	"test should be true for array with one element": function () {
		var iterator = hub.iterator([null]);
		
		assert(iterator.hasNext);
	},

	"test should change to false after one call": function () {
		var iterator = hub.iterator([null]);
		
		iterator();
		
		assertFalse(iterator.hasNext);
	},

	"test should change to false after two calls": function () {
		var iterator = hub.iterator([null, null]);
		
		iterator();
		iterator();
		
		assertFalse(iterator.hasNext);
	}
		
});
	
(function () {

	function assertValueAfterRemove(index, value) {
		var arr = [0, 1, 2, 3];
		var iterator = hub.iterator(arr);
		iterator();
		iterator();
		
		iterator.remove(index);
		var result = iterator();
		
		assertEquals(value, result);
	}
	
	TestCase("IteratorRemoveTest", {
	
		"test should be function": function () {
			var iterator = hub.iterator([]);
			
			assertFunction(iterator.remove);
		},
	
		"test should change hasNext to false": function () {
			var iterator = hub.iterator([null]);
			
			iterator.remove();
			
			assertFalse(iterator.hasNext);
		},
	
		"test should remove item at current index": function () {
			var arr = [0, 1, 2, 3];
			var iterator = hub.iterator(arr);
			iterator();
			
			iterator.remove();
			
			assertEquals([0, 2, 3], arr);
		},
	
		"test should remove item at given index": function () {
			var arr = [0, 1, 2, 3];
			var iterator = hub.iterator(arr);
			
			iterator.remove(2);
			
			assertEquals([0, 1, 3], arr);
		},
	
		"test should remove given value": function () {
			var arr = ["a", "b"];
			var iterator = hub.iterator(arr);
			
			iterator.remove("b");
			
			assertEquals(["a"], arr);
		},
	
		"test remove should return true if found": function () {
			var iterator = hub.iterator(["a"]);
			
			var result = iterator.remove("a");
			
			assert(result);
		},
	
		"test remove should return false if not found": function () {
			var iterator = hub.iterator(["a"]);
			
			var result = iterator.remove("b");
			
			assertFalse(result);
		},
	
		"test remove should return false if no next": function () {
			var iterator = hub.iterator([]);
			
			var result = iterator.remove();
			
			assertFalse(result);
		},
	
		"test remove with current index": function () {
			assertValueAfterRemove(1, 2);
		},
	
		"test remove with previous index": function () {
			assertValueAfterRemove(0, 2);
		},
	
		"test remove with next index": function () {
			assertValueAfterRemove(2, 3);
		}
		
	});
	
}());

TestCase("IteratorInsertTest", {
	
	"test should be function": function () {
		var iterator = hub.iterator([]);
		
		assertFunction(iterator.insert);
	},

	"test should change hasNext to true": function () {
		var iterator = hub.iterator([]);
		
		iterator.insert({});
		
		assert(iterator.hasNext);
	},

	"test should return inserted item": function () {
		var value = {};
		var iterator = hub.iterator([]);
		
		iterator.insert(value);
		var result = iterator();
		
		assertSame(value, result);
	},

	"test should insert at current position": function () {
		var arr = [0, 1, 2, 3];
		var iterator = hub.iterator(arr);
		
		iterator();
		iterator();
		iterator.insert(4);
		
		assertEquals([0, 1, 4, 2, 3], arr);
	},

	"test insert at specific position": function () {
		var arr = [0, 1, 2, 3];
		var iterator = hub.iterator(arr);
		
		iterator.insert(3, 4);
		
		assertEquals([0, 1, 2, 4, 3], arr);
	},

	"test insert at current index": function () {
		var arr = [0, 1, 2];
		var iterator = hub.iterator(arr);
		
		iterator();
		iterator.insert(1, 3);
		
		assertEquals(3, iterator());
	},

	"test insert before current index": function () {
		var arr = [0, 1, 2];
		var iterator = hub.iterator(arr);
		
		iterator();
		iterator.insert(0, 3);
		
		assertEquals(1, iterator());
	},

	"test insert after current index": function () {
		var arr = [0, 1, 2];
		var iterator = hub.iterator(arr);
		
		iterator();
		iterator.insert(2, 3);
		
		assertEquals(1, iterator());
	}
	
});

TestCase("IteratorResetTest", {

	"test should be function": function () {
		var iterator = hub.iterator([]);
		
		assertFunction(iterator.reset);
	},

	"test should point to first item after reset": function () {
		var iterator = hub.iterator([0, 1]);
		
		iterator();
		iterator();
		iterator.reset();
		
		assert(iterator.hasNext);
		assertEquals(0, iterator());
	}

});
