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
		var iterator = Hub.iterator(arguments.length ?
			Array.prototype.slice.call(arguments) : []);
		function callChain() {
			callChain.aborted = false;
			var top = !iteratorStack.length;
			if(top) {
				aborted = false;
				args = arguments;
			}
			result = undefined;
			try {
				iteratorStack.push(iterator);
				while(next()) {
					// This comment avoids "empty while" compiler warning.
				}
			}
			finally {
				callChain.aborted = aborted;
				iterator.reset();
				if(top) {
					iteratorStack.length = 0;
				}
			}
			if(!iteratorStack.length) {
				var returnValue = result;
				result = undefined;
				args = undefined;
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
		callChain.remove = function(fn, topic) {
			if(chainTopic === topic) {
				return fns.remove(fn);
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
