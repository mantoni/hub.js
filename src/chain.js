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
				result = undefined;
			}
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
			if(typeof fn.all === "function") {
				var all = fn.all();
				if(iterator) {
					for(var i = 0, l = all.length; i < l; i++) {
						iterator.insert(i, all[i]);
					}
				}
				else {
					fns = all.concat(fns);
				}
			}
			else if(iterator) {
				iterator.insert(0, fn);
			}
			else {
				fns.unshift(fn);
			}
		};
		callChain.insert = function(index, fn) {
			if(iterator) {
				iterator.insert(index, fn);
			}
			else {
				fns.splice(index, 0, fn);
			}
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
		callChain.all = function() {
			return fns;
		};
		return callChain;
	}
	
	function compareTopics(left, right) {
		var lw = left.indexOf("*");
		var rw = right.indexOf("*");
		var ls = left.indexOf("/");
		var rs = right.indexOf("/");
		if(lw < ls) {
			if(rw > rs) {
				return -1;
			}
		}
		else {
			if(rw < rs) {
				return 1;
			}
		}
		return 0;
	}
	
	function topicChain() {
		var callChain = chain();
		var remove = callChain.remove;
		var topics = [];
		callChain.add = function(fn, topic) {
			if(typeof fn.all === "function") {
				var all = fn.all();
				for(var i = all.length - 1; i >= 0; i--) {
					callChain.add(all[i], topic);
				}
			}
			else {
				if(topic.indexOf("*") === -1) {
					callChain.insert(topics.length, fn);
					return;
				}
				for(var i = 0, l = topics.length; i < l; i++) {
					if(compareTopics(topic, topics[i]) <= 0) {
						topics.splice(i, 0, topic);
						callChain.insert(i, fn);
						return;
					}
				}
				callChain.insert(topics.length, fn);
				topics.push(topic);
			}
		};
		callChain.remove = function(fn) {
			var index = remove(fn);
			if(index !== -1 && index < topics.length) {
				topics.splice(index, 1);
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
	Hub.util.topicChain = topicChain;
	
}());
