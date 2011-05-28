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
(function () {

	function assertValueAfterRemove(index, value) {
		var arr = [0, 1, 2, 3];
		var i = hub.iterator(arr);
		i();
		i();
		i.remove(index);
		assertEquals(value, i());
	}

	TestCase("IteratorTest", {

		"test should implement iterator": function () {
			assertFunction(hub.iterator);
		},
	
		"test should return function": function () {
			assertFunction(hub.iterator([]));
		},
			
		"test should throw if no argument": function () {
			assertException(function () {
				hub.iterator();
			});
		},
	
		"test should return first array element when invoked": function () {
			var value = {};
			assertSame(value, hub.iterator([value])());
		},
	
		"test should throw if out of bounds": function () {
			var i = hub.iterator([]);
			assertException(i);
		}
		
	});
	
	TestCase("IteratorHasNextTest", {
		
		"test hasNext should be false for empty array": function () {
			assertFalse(hub.iterator([]).hasNext);
		},
	
		"test hasNext should be true for array with one element": function () {
			assert(hub.iterator([null]).hasNext);
		},

		"test hasNext should change to false after one call": function () {
			var i = hub.iterator([null]);
			i();
			assertFalse(i.hasNext);
		},
	
		"test hasNext should change to false after two calls": function () {
			var i = hub.iterator([null, null]);
			i();
			i();
			assertFalse(i.hasNext);
		}
			
	});
	
	TestCase("IteratorRemoveTest", {
	
		"test should implement remove": function () {
			assertFunction(hub.iterator([]).remove);
		},
	
		"test hasNext should be false after remove": function () {
			var i = hub.iterator([null]);
			i.remove();
			assertFalse(i.hasNext);
		},
	
		"test should remove item at current index": function () {
			var arr = [0, 1, 2, 3];
			var i = hub.iterator(arr);
			i();
			i.remove();
			assertEquals([0, 2, 3], arr);
		},
	
		"test should remove item at given index": function () {
			var arr = [0, 1, 2, 3];
			hub.iterator(arr).remove(2);
			assertEquals([0, 1, 3], arr);
		},
	
		"test should remove given value": function () {
			var arr = ["a", "b"];
			hub.iterator(arr).remove("b");
			assertEquals(["a"], arr);
		},
	
		"test remove should return true if found": function () {
			assert(hub.iterator(["a"]).remove("a"));
		},
	
		"test remove should return false if not found": function () {
			assertFalse(hub.iterator(["a"]).remove("b"));
		},
	
		"test remove should return false if no next": function () {
			assertFalse(hub.iterator([]).remove());
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
	
	TestCase("IteratorInsertTest", {
		
		"test should implement insert": function () {
			assertFunction(hub.iterator([]).insert);
		},
	
		"test should change hasNext to true": function () {
			var i = hub.iterator([]);
			i.insert({});
			assert(i.hasNext);
		},
	
		"test should return inserted item": function () {
			var value = {};
			var i = hub.iterator([]);
			i.insert(value);
			assertSame(value, i());
		},
	
		"test should insert at current position": function () {
			var arr = [0, 1, 2, 3];
			var i = hub.iterator(arr);
			i();
			i();
			i.insert(4);
			assertEquals([0, 1, 4, 2, 3], arr);
		},
	
		"test insert at specific position": function () {
			var arr = [0, 1, 2, 3];
			var i = hub.iterator(arr);
			i.insert(3, 4);
			assertEquals([0, 1, 2, 4, 3], arr);
		},
	
		"test insert at current index": function () {
			var arr = [0, 1, 2];
			var i = hub.iterator(arr);
			i();
			i.insert(1, 3);
			assertEquals(3, i());
		},
	
		"test insert before current index": function () {
			var arr = [0, 1, 2];
			var i = hub.iterator(arr);
			i();
			i.insert(0, 3);
			assertEquals(1, i());
		},
	
		"test insert after current index": function () {
			var arr = [0, 1, 2];
			var i = hub.iterator(arr);
			i();
			i.insert(2, 3);
			assertEquals(1, i());
		}
		
	});
	
	TestCase("IteratorResetTest", {
	
		"test should implement reset": function () {
			assertFunction(hub.iterator([]).reset);
		},
	
		"test should point to first item after reset": function () {
			var i = hub.iterator([0, 1]);
			i();
			i();
			assertFalse(i.hasNext);
			i.reset();
			assert(i.hasNext);
			assertEquals(0, i());
		}

	});

}());