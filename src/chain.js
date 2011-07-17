/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */	
/**
 * creates a call chain for the given functions. The returned chain is a
 * function itself which will invoke all functions in the given order.
 * The chain implements add(Function) and remove(Function) to add and
 * remove functions from the chain.
 * Chain iteration can be aborted via this.stopPropagation() or
 * explicitly triggered via this.propagate().
 * 
 * @param {...Function} the functions to chain.
 * @return {Function} the chain function.
 */
hub.chain = function () {
	var iterator = hub.iterator(arguments.length ?
		Array.prototype.slice.call(arguments) : []);
	function callChain() {
		var thiz = this.propagate ? this : hub.scope();
		thiz.push(iterator);
		return thiz.propagate.apply(thiz, arguments);
	}
	callChain.on = function (fn) {
		var fnType = typeof fn;
		if (fnType !== "function") {
			throw new TypeError("Callback is " + fnType);
		}
		iterator.insert(0, fn);
	};
	callChain.un = iterator.remove;
	return callChain;
};	
