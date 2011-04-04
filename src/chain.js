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
	var iterator;
	var aborted = false;
	var result;
	var args;
	
	function next() {
		if(aborted || !iterator.hasNext) {
			return false;
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
		var running = false;
		function callChain() {
			var previousIterator = iterator;
			var previousAborted = aborted;
			var previousResult = result;
			var previousArgs = args;
			result = undefined;
			try {
				iterator = Hub.iterator(fns);
				args = arguments;
				while(next()) {
					// Avoid "empty while" compiler warning.
				}
				return result;
			}
			finally {
				iterator = previousIterator;
				chain.aborted = aborted;
				aborted = previousAborted;
				result = previousResult;
				args = previousArgs;
				running = false;
			}
		}
		callChain.add = function(fn) {
			if(typeof fn.all === "function") {
				var all = fn.all();
				if(running) {
					for(var i = 0, l = all.length; i < l; i++) {
						iterator.insert(i, all[i]);
					}
				}
				else {
					fns = all.concat(fns);
				}
			}
			else if(running) {
				iteartor.insert(0, fn);
			}
			else {
				fns.unshift(fn);
			}
		};
		callChain.insert = function(index, fn) {
			if(running) {
				iterator.insert(index, fn);
			}
			else {
				fns.splice(index, 0, fn);
			}
		};
		callChain.remove = function(fn) {
			if(typeof fn === "number") {
				if(running) {
					iterator.remove(fn);
				}
				else {
					fns.splice(fn, 1);
				}
				return fn;
			}
			for(var i = fns.length; i--;) {
				if(fns[i] === fn) {
					if(running) {
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
