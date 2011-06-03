/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * provides call chains, the possibility to explicitly propagate calls, or
 * stop propagation in the current call chain.
 */
(function () {
	
	var aborted = false;
	var scope;
	var args;
	var result;
	var iteratorStack = [];
	
	function next() {
		var size = iteratorStack.length;
		if (!size) {
			return false;
		}
		var iterator = iteratorStack[size - 1];
		if (!iterator.hasNext) {
			iteratorStack.pop();
			return next();
		}
		var nextResult = iterator().apply(scope, args);
		result = hub.merge(result, nextResult);
		return true;
	}
	
	/**
	 * creates a call chain for the given functions. The returned
	 * chain is a function itself which will invoke all functions in
	 * the given order.
	 * The chain implements add(Function) and remove(Function) to add
	 * and remove functions from the chain.
	 * Chain iteration can be aborted via hub.stopPropagation() or
	 * explicitly triggered via hub.propagate().
	 * 
	 * @param {...Function} the functions to chain.
	 * @return {Function} the chain function.
	 */
	function chain() {
		var iterator = hub.iterator(arguments.length ?
			Array.prototype.slice.call(arguments) : []);
		function callChain() {
			var top = !iteratorStack.length;
			if (top) {
				aborted = false;
				args = arguments;
				result = undefined;
			}
			var previousScope = scope;
			scope = this;
			iteratorStack.push(iterator);
			try {
				while (true) {
					if (!next()) {
						break;
					}
				}
			} finally {
				iterator.reset();
				if (top) {
					iteratorStack.length = 0;
				}
				scope = previousScope;
			}
			if (!iteratorStack.length) {
				var returnValue = result;
				result = undefined;
				args = undefined;
				scope = undefined;
				return returnValue;
			}
		}
		callChain.add = function (fn) {
			var fnType = typeof fn;
			if (fnType !== "function") {
				throw new TypeError("Callback is " + fnType);
			}
			iterator.insert(0, fn);
		};
		callChain.insert = iterator.insert;
		callChain.remove = iterator.remove;
		return callChain;
	}
	
	/**
	 * stops message propagation for the current call chain.
	 */
	hub.stopPropagation = function () {
		aborted = true;
		iteratorStack.length = 0;
		if (arguments.length) {
			result = arguments[0];
		}
	};
	
	/**
	 * explicitly propagates the message to the next function in the current
	 * call chain.
	 */
	hub.propagate = function () {
		if (arguments.length) {
			result = arguments[0];
		}
		next();
	};
	
	/**
	 * whether the last publish was aborted or not.
	 *
	 * @return {Boolean} true if the last publish was aborted.
	 */
	hub.aborted = function () {
		return aborted;
	};
	
	hub.chain = chain;

}());
