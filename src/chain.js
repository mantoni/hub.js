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
	function chain() {
		var iterator = hub.iterator(arguments.length ?
			Array.prototype.slice.call(arguments) : []);
		function callChain() {
			var thiz = this.propagate ? this : hub.scope(arguments);
			thiz.push(iterator);
			return thiz.propagate();
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
		
	hub.chain = chain;	

}());
