/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * creates an iterator for the given array. The iterators is a function itself
 * which returns the current element and advances the internal cursor by one.
 *
 * @param {Array} array the array to iterate.
 */
hub.iterator = function (array) {
	var index = 0;
	var length = array.length;
	
	/**
	 * is the iterator function. Returns the element at the internal cursor
	 * position and increments the cursor by one.
	 * If the internal cursor of the iterator exceeds the length of the array
	 * an error is thrown.
	 *
	 * @return {*}
	 */
	function iterator() {
		if (index >= length) {
			throw new Error("Iterator out of bounds.");
		}
		var item = array[index++];
		iterator.hasNext = index < length;
		return item;
	}
	/**
	 * indicated whether more elements are available for iteration.
	 *
	 * @type Boolean
	 */
	iterator.hasNext = index < length;
	
	/**
	 * removes an element from the underlying array. If an index is specified
	 * the element at that index is removed. Otherwise the element at the
	 * internal cursor position is removed.
	 *
	 * @param {*} object the optional object or index to remove.
	 */
	iterator.remove = function remove(object) {
		var type = typeof object;
		var i;
		if (type === "undefined") {
			object = index;
		} else if (type === "number") {
			if (object < index) {
				index--;
			}
		} else {
			for (i = array.length - 1; i >= 0; i--) {
				if (array[i] === object) {
					object = i;
					break;
				}
			}
			if (i < 0) {
				return false;
			}
		}
		if (object >= length) {
			return false;
		}
		array.splice(object, 1);
		iterator.hasNext = index < --length;
		return true;
	};
	
	/**
	 * inserts an element from the underlying array. If an index is specified
	 * the new element is inserted at that index. Otherwise the element is
	 * inserted at the internal cursor position.
	 *
	 * @param {Number} index the optional index.
	 * @param {*} element the element to insert.
	 */
	iterator.insert = function insert(i, element) {
		if (typeof element === "undefined") {
			element = i;
			i = index;
		} else if (i < index) {
			index++;
		}
		array.splice(i, 0, element);
		iterator.hasNext = index < ++length;
	};
	
	/**
	 * resets the iterator so that the internal cursor position is zero.
	 */
	iterator.reset = function () {
		index = 0;
		iterator.hasNext = index < length;
	};
	
	return iterator;
};
