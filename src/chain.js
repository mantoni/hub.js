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
		var nextIndex = -1;
		function callChain() {
			/*
			 * is an iterator function that iterates over the internal array of
			 * functions invoking each with the arguments of this function. The
			 * iterator advances to the next function after each call and
			 * returns true. If there are no functions left, the iterator
			 * function returns false. To stop the iterator, the "stop" property
			 * can be set to true. The iterator uses Hub.util.merge to merge the
			 * results of all invoked functions.
			 */
			var args = arguments;
			function iterator() {
				if(nextIndex < fns.length && !iterator.stop) {
					iterator.result = Hub.util.merge(iterator.result,
						fns[nextIndex++].apply(null, args));
					return true;
				}
				return false;
			}
			var previous = currentCallIterator;
			currentCallIterator = iterator;
			nextIndex = 0;
			try {
				while(iterator()) {
					// Avoid "empty while" compiler warning.
				}
				return iterator.result;
			}
			finally {
				currentCallIterator = previous;
			}
		}
		callChain.add = function(fn) {
			if(typeof fn.all === "function") {
				var all = fn.all();
				fns = all.concat(fns);
				if(nextIndex !== -1) {
					nextIndex += all.length;
				}
			}
			else {
				fns.unshift(fn);
				if(nextIndex !== -1) {
					nextIndex++;
				}
			}
		};
		callChain.insert = function(index, fn) {
			fns.splice(index, 0, fn);
			if(index < nextIndex) {
				nextIndex++;
			}
		};
		callChain.remove = function(fn) {
			if(typeof fn === "number") {
				fns.splice(fn, 1);
				if(fn < nextIndex) {
					nextIndex--;
				}
				return fn;
			}
			for(var i = fns.length; i--;) {
				if(fns[i] === fn) {
					fns.splice(i, 1);
					if(i < nextIndex) {
						nextIndex--;
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
		currentCallIterator.stop = true;
	};
	
	/**
	 * explicitly propagates the message to the next function in the current
	 * call chain.
	 */
	Hub.propagate = function() {
		currentCallIterator();
		return currentCallIterator.result;
	};
	
	Hub.util.chain = chain;
	Hub.util.topicChain = topicChain;
	
}());
