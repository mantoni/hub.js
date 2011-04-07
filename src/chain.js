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
	
	var aborted = false;
	var args;
	var result;
	var iteratorStack = [];
	
	function next() {
		var size = iteratorStack.length;
		if(!size) {
			return false;
		}
		var iterator = iteratorStack[size - 1];
		if(!iterator.hasNext) {
			iteratorStack.pop();
			return next();
		}
		result = Hub.util.merge(result, iterator().apply(null, args));
		return true;
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
		var iterator = false;
		function callChain() {
			chain.aborted = false;
			if(!iteratorStack.length) {
				aborted = false;
				args = arguments;
			}
			result = undefined;
			try {
				iterator = Hub.iterator(fns);
				iteratorStack.push(iterator);
				while(next()) {
					// Avoid "empty while" compiler warning.
				}
			}
			finally {
				chain.aborted = aborted;
				iterator = false;
			}
			if(!iteratorStack.length) {
				var returnValue = result;
				result = undefined;
				args = undefined;
				return returnValue;
			}
		}
		callChain.add = function(fn) {
			if(iterator) {
				iterator.insert(0, fn);
			}
			else {
				fns.unshift(fn);
			}
			return callChain;
		};
		callChain.insert = function(index, fn) {
			if(iterator) {
				iterator.insert(index, fn);
			}
			else {
				fns.splice(index, 0, fn);
			}
			return callChain;
		};
		callChain.remove = function(fn) {
			if(typeof fn === "number") {
				if(iterator) {
					iterator.remove(fn);
				}
				else {
					fns.splice(fn, 1);
				}
				return fn;
			}
			for(var i = fns.length; i--;) {
				if(fns[i] === fn) {
					if(iterator) {
						iterator.remove(i);
					}
					else {
						fns.splice(i, 1);
					}
					return i;
				}
			}
			return -1;
		};
		callChain.get = function(index) {
			return fns[index];
		};
		return callChain;
	}
	
	function sortedChain(comparator) {
		if(!comparator) {
			throw new Error("comparator is " + comparator);
		}
		var callChain = chain();
		var remove = callChain.remove;
		var orders = [];
		callChain.add = function(fn, order) {
			if(typeof order === "undefined") {
				throw new Error("Expected 2 arguments");
			}
			for(var i = 0, l = orders.length; i < l; i++) {
				if(comparator(order, orders[i]) <= 0) {
					orders.splice(i, 0, order);
					callChain.insert(i, fn);
					return callChain;
				}
			}
			callChain.insert(orders.length, fn);
			orders.push(order);
			return callChain;
		};
		callChain.remove = function(fn) {
			var index = remove(fn);
			if(index !== -1 && index < orders.length) {
				orders.splice(index, 1);
			}
			return index;
		};
		return callChain;
	}
	
	/**
	 * stops message propagation for the current call chain.
	 */
	Hub.stopPropagation = function() {
		aborted = true;
		iteratorStack.length = 0;
	};
	
	/**
	 * explicitly propagates the message to the next function in the current
	 * call chain.
	 */
	Hub.propagate = function() {
		next();
	};
	
	Hub.util.chain = chain;
	Hub.util.sortedChain = sortedChain;
	
}());
