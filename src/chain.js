/*jslint undef: true*/
/*global Hub*/
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
	var scope;
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
		result = Hub.merge(result, iterator().apply(scope, args));
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
		var iterator = Hub.iterator(arguments.length ?
			Array.prototype.slice.call(arguments) : []);
		function callChain() {
			callChain.aborted = false;
			var top = !iteratorStack.length;
			if(top) {
				aborted = false;
				args = arguments;
			}
			var previousScope = scope;
			scope = this;
			result = undefined;
			try {
				iteratorStack.push(iterator);
				var running = true;
				do {
					running = next();
				}
				while(running);
			}
			finally {
				callChain.aborted = aborted;
				iterator.reset();
				if(top) {
					iteratorStack.length = 0;
				}
				scope = previousScope;
			}
			if(!iteratorStack.length) {
				var returnValue = result;
				result = undefined;
				args = undefined;
				scope = undefined;
				return returnValue;
			}
		}
		callChain.add = function(fn) {
			iterator.insert(0, fn);
		};
		callChain.insert = iterator.insert;
		callChain.remove = iterator.remove;
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
	
	/**
	 * compares two topics. Returns 0 if the topics have the same priority,
	 * -1 if the first given topic is "smaller"" the second one and 1 if
	 * the first topic is "larger" than the second one. This means that a
	 * subscriber for the "smaller" topic gets invoked before a subscriber
	 * for the "larger" topic.
	 *
	 * @param {String} left the first topic.
	 * @param {String} right the second topic.
	 * @return {Number} 0, 1 or -1.
	 */
	Hub.topicComparator = function(left, right) {
		var leftStar = left.indexOf("*");
		var rightStar = right.indexOf("*");
		if(leftStar === -1) {
			return rightStar === -1 ? 0 : 1;
		}
		if(rightStar === -1) {
			return -1;
		}
		var leftSlash = left.indexOf("/");
		var rightSlash = right.indexOf("/");
		if(leftStar < leftSlash) {
			if(rightStar > rightSlash) {
				return -1;
			}
		}
		else if(rightStar < rightSlash) {
			return 1;
		}
		return 0;
	};
	
	Hub.chain = chain;

}());
