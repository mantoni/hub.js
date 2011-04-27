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
        var fns = arguments.length ?
			Array.prototype.slice.call(arguments) : [];
		var iterator = false;
		function callChain() {
			callChain.aborted = false;
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
				callChain.aborted = aborted;
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
		callChain.size = function() {
			return fns.length;
		};
		callChain.get = function(index) {
			if(index < 0 || index > fns.length) {
				throw new Error("Index out of bounds");
			}
			return fns[index];
		};
		return callChain;
	}
	
	function pathMatcher(name) {
		var exp = name.replace(/\./g, "\\.").replace(
			/\*\*/g, "([a-zA-Z0-9\\.#]+|##)").replace(
			/\*/g, "([a-zA-Z0-9\\*]+)").replace(/#/g, "\\*");
		return new RegExp("^" + exp + "$");
	}
	
	var ROOT_TOPIC = "**/**";
	
	function topicChain(chainTopic) {
		if(!chainTopic) {
			chainTopic = ROOT_TOPIC;
		}
		var chainTopicMatcher = pathMatcher(chainTopic);
		var fns = chain();
		var children = [];
		var callChain = function(topic, args, queue) {
			if(!topic) {
				topic = chainTopic;
			}
			if(topic !== ROOT_TOPIC && !chainTopicMatcher.test(topic)) {
				if(topic.indexOf("*") === -1 ||
						!pathMatcher(topic).test(chainTopic)) {
					return;
				}
				topic = ROOT_TOPIC;
			}
			var result = fns.apply(null, args);
			if(fns.aborted) {
				callChain.aborted = true;
				return result;
			}
			if(!queue) {
				queue = children.slice();
			}
			else {
				for(var i = 0, l = children.length; i < l; i++) {
					queue.push(children[i]);
				}
			}
			while(queue.length) {
				var child = queue.shift();
				result = Hub.util.merge(result, child(topic, args, queue));
				if(child.aborted) {
					callChain.aborted = true;
					break;
				}
			}
			return result;
		};
		callChain.matches = function(topic) {
			return chainTopicMatcher.test(topic);
		};
		callChain.getTopic = function() {
			return chainTopic;
		};
		callChain.add = function(fn, topic, topicMatcher) {
			if(chainTopic === topic) {
				fns.add(fn);
				return;
			}
			var newChild;
			for(var i = 0, l = children.length; i < l; i++) {
				var child = children[i];
				if(child.matches(topic)) {
					child.add(fn, topic, topicMatcher);
					return;
				}
				if(!topicMatcher) {
					topicMatcher = pathMatcher(topic);
				}
				if(topicMatcher.test(child.getTopic())) {
					newChild = topicChain(topic);
					newChild.addChild(child);
					newChild.add(fn, topic, topicMatcher);
					children[i] = newChild;
					return;
				}
			}
			newChild = topicChain(topic);
			newChild.add(fn, topic);
			if(topic.indexOf("*") === -1) {
				children.unshift(newChild);
			}
			else {
				for(var i = 0, l = children.length; i < l; i++) {
					var childTopic = children[i].getTopic();
					var result = Hub.topicComparator(childTopic, topic);
					if(result !== -1) {
						children.splice(i, 0, newChild);
						return;
					}
				}
				children.push(newChild);
			}
		};
		callChain.addChild = function(child) {
			children.unshift(child);
		};
		callChain.getChild = function(topic, topicMatcher) {
			if(chainTopic === topic) {
				return this;
			}
			if(!topicMatcher) {
				topicMatcher = pathMatcher(topic);
			}
			if(topicMatcher.test(chainTopic)) {
				return this;
			}
			for(var i = 0, l = children.length; i < l; i++) {
				var result = children[i].getChild(topic, topicMatcher);
				if(result) {
					return result;
				}
			}
		};
		callChain.remove = function(fn, topic) {
			if(chainTopic === topic) {
				return fns.remove(fn) !== -1;
			}
			for(var i = 0, l = children.length; i < l; i++) {
				var child = children[i];
				if(child.matches(topic)) {
					if(child.remove(fn, topic)) {
						return true;
					}
				}
			}
			return false;
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
	Hub.topicChain = topicChain;
	
}());
