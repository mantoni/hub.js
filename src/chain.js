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
	
	function scope(args) {
		var iteratorStack = [];
		var aborted = false;
		var result;
		return {
			/**
			 * stops message propagation for the current call chain.
			 */
			stopPropagation: function () {
				aborted = true;
				iteratorStack.length = 0;
				if (arguments.length) {
					result = arguments[0];
				}
			},
			/**
			 * explicitly propagates the message to the next function in the
			 * current call chain.
			 */
			propagate: function () {
				if (arguments.length) {
					result = arguments[0];
				}
				var size = iteratorStack.length;
				if (!size) {
					return false;
				}
				var iterator = iteratorStack[size - 1];
				if (!iterator.hasNext) {
					iteratorStack.pop();
					return this.propagate();
				}
				var nextResult = iterator().apply(this, args);
				result = hub.merge(result, nextResult);
				return true;
			},
			aborted: function () {
				return aborted;
			},
			result: function () {
				return result;
			},
			push: function (iterator) {
				iteratorStack.push(iterator);
			}
		};
	}
	
	/**
	 * creates a call chain for the given functions. The returned
	 * chain is a function itself which will invoke all functions in
	 * the given order.
	 * The chain implements add(Function) and remove(Function) to add
	 * and remove functions from the chain.
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
			var thiz = this.propagate ? this : scope(arguments);
			thiz.push(iterator);
			try {
				while (true) {
					if (!thiz.propagate()) {
						break;
					}
				}
			} finally {
				iterator.reset();
			}
			return thiz.result();
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
	
	var rootTopic = "**";
	
	function pathMatcher(name) {
		var exp = name.replace(/\./g, "\\.").replace(
			/\*\*/g,
			"([a-zA-Z0-9\\.#]+|##)"
		).replace(
			/\*/g,
			"([a-zA-Z0-9\\*]+)"
		).replace(/#/g, "\\*");
		return new RegExp("^" + exp + "$");
	}
	
	// ensures the given argument is a valid topic. Throws an error otherwise.
	function validateTopic(topic) {
		var type = typeof topic;
		if (type !== "string") {
			throw new Error("Topic is " + type);
		}
		if (!topic) {
			throw new Error("Topic is empty");
		}
		if (!(/^[a-zA-Z0-9\.\{\}\*]+$/.test(topic))) {
			throw new Error("Illegal topic: " + topic);
		}
	}
	
	/**
	 * compares two topics. Returns 0 if the topics have the same priority,
	 * -1 if the first given topic is "smaller" the second one and 1 if the
	 * first topic is "larger" than the second one. This means that a
	 * subscriber for the "smaller" topic gets invoked before a subscriber
	 * for the "larger" topic.
	 *
	 * @param {String} left the first topic.
	 * @param {String} right the second topic.
	 * @return {Number} 0, 1 or -1.
	 */
	function topicComparator(left, right) {
		var leftStar = left.indexOf("*");
		var rightStar = right.indexOf("*");
		if (leftStar === -1) {
			return rightStar === -1 ? 0 : 1;
		}
		if (rightStar === -1) {
			return -1;
		}
		var leftSlash = left.indexOf(".");
		var rightSlash = right.indexOf(".");
		if (leftStar < leftSlash) {
			if (rightStar > rightSlash) {
				return -1;
			}
		} else if (rightStar < rightSlash) {
			return 1;
		}
		return 0;
	}
	
	function topicChain(chainTopic, firstChild) {
		if (!chainTopic) {
			chainTopic = rootTopic;
		} else {
			validateTopic(chainTopic);
		}
		var chainTopicMatcher = pathMatcher(chainTopic);
		var fns = chain();
		var children = firstChild ? [firstChild] : [];
		function callChain(topic) {
			if (!topic) {
				topic = chainTopic;
			}
			if (topic !== rootTopic && !chainTopicMatcher.test(topic)) {
				if (topic.indexOf("*") === -1 ||
						!pathMatcher(topic).test(chainTopic)) {
					return;
				}
				topic = rootTopic;
			}
			var thiz = this.propagate ? this : scope(
				Array.prototype.slice.call(arguments, 1)
			);
			fns.call(thiz);
			if (thiz.aborted()) {
				return thiz.result();
			}
			var queue = thiz.topicChainQueue;
			if (queue) {
				Array.prototype.push.apply(queue, children);
			} else {
				queue = thiz.topicChainQueue = children.slice();
			}
			while (queue.length) {
				var child = queue.shift();
				child.call(thiz, topic);
				if (thiz.aborted()) {
					break;
				}
			}
			return thiz.result();
		}
		callChain.matches = function (topic) {
			return chainTopicMatcher.test(topic);
		};
		callChain.getTopic = function () {
			return chainTopic;
		};
		callChain.add = function (topic, fn, topicMatcher) {
			if (chainTopic === topic) {
				fns.add(fn);
				return;
			}
			var newChild, i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					child.add(topic, fn, topicMatcher);
					return;
				}
				if (!topicMatcher) {
					topicMatcher = pathMatcher(topic);
				}
				if (topicMatcher.test(child.getTopic())) {
					newChild = topicChain(topic, child);
					newChild.add(topic, fn, topicMatcher);
					children[i] = newChild;
					return;
				}
			}
			newChild = topicChain(topic);
			newChild.add(topic, fn);
			if (topic.indexOf("*") === -1) {
				children.unshift(newChild);
			} else {
				for (i = 0, l = children.length; i < l; i++) {
					var childTopic = children[i].getTopic();
					var result = topicComparator(childTopic, topic);
					if (result !== -1) {
						children.splice(i, 0, newChild);
						return;
					}
				}
				children.push(newChild);
			}
		};
		callChain.remove = function (topic, fn) {
			if (chainTopic === topic) {
				return fns.remove(fn);
			}
			var i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					if (child.remove(topic, fn)) {
						return true;
					}
				}
			}
			validateTopic(topic);
			var fnType = typeof fn;
			if (fnType !== "function") {
				throw new TypeError("Callback is " + fnType);
			}
			return false;
		};
		return callChain;
	}
	
	hub.scope = scope;
	hub.chain = chain;	
	hub.topicChain = topicChain;
	hub.topicComparator = topicComparator;
	hub.validateTopic = validateTopic;

}());
