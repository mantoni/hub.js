/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * provides call chains, the possibility to explicitly propagate calls, or
 * stop propagation in the current call chain.
 */
(function() {
	
	/**
	 * The call iterator for the current call chain.
	 *
	 * @type {Function}
	 */
	var currentCallIterator;
	
	/**
	 * returns an iterator function that iterates over an array of functions
	 * invoking each with the given arguments. The iterator advances to the
	 * next function after each call and returns true. If there are no
	 * functions left, the iterator function returns false. To stop the
	 * iterator, set the "stop" property to true. The iterator uses
	 * Hub.util.merge to merge the results of all invoked functions and makes
	 * the result accessible via the "result" property.
	 *
	 * @param {Array} fns the functions to iterate over.
	 * @param {Array} args the arguments to pass to each function.
	 * @return {Boolean} true if there are more functions to iterate,
	 * otherwise false.
	 */
	function callIterator(fns, args) {
		var index = 0;
		function iterator() {
			if(index < fns.length && !iterator.stop) {
				iterator.result = Hub.util.merge(iterator.result,
					fns[index++].apply(null, args));
				return true;
			}
			return false;
		}
		return iterator;
	}
	
	/**
	 * creates a call chain for the given functions. The returned
	 * chain is a function itself which will invoke all functions in
	 * the given order.
	 * The chain implements add(Function) and remove(Function) to add
	 * and remove functions from the chain.
	 * Chain iteration can be aborted via Hub.stopPropagation() or
	 * explicitly triggered via Hub.propagate().
	 * 
	 * @param {...Function} the functions to chain.
	 * @return {Function} the chain function.
	 */
	function chain() {
		var fns = arguments.length ? Array.prototype.slice.call(arguments) : [];
		var copy = null;
		function callChain() {
			if(!copy) {
				copy = Array.prototype.slice.call(fns);
			}
			var previous = currentCallIterator;
			currentCallIterator = callIterator(copy, arguments);
			try {
				while(currentCallIterator()) {
					// Avoid "empty while" compiler warning.
				}
				return currentCallIterator.result;
			}
			finally {
				currentCallIterator = previous;
			}
		}
		callChain.add = function(fn) {
			fns.unshift(fn);
			copy = null;
		};
		callChain.remove = function(fn) {
			for(var i = fns.length; i--;) {
				if(fns[i] === fn) {
					fns.splice(i, 1);
					break;
				}
			}
			copy = null;
		};
		return callChain;
	}
	
	/**
	 * stops message propagation for the current call chain.
	 */
	Hub.stopPropagation = function() {
		currentCallIterator.stop = true;
	};
	
	/**
	 * explicitly propagates the message to the next function in the current
	 * call chain.
	 */
	Hub.propagate = function() {
		currentCallIterator();
	};
	
	Hub.util.chain = chain;
	
}());
