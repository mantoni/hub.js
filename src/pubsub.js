/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 *
 */
(function () {
	
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
		}
		var chainTopicMatcher = pathMatcher(chainTopic);
		var fns = hub.chain();
		var children = firstChild ? [firstChild] : [];
		function callChain(topic, args, queue) {
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
			var result = args && args.length ?
							fns.apply(this, args) : fns.call(this);
			if (fns.aborted) {
				callChain.aborted = true;
				return result;
			}
			if (!queue) {
				queue = children.slice();
			} else {
				var i, l;
				for (i = 0, l = children.length; i < l; i++) {
					queue.push(children[i]);
				}
			}
			while (queue.length) {
				var child = queue.shift();
				var childResult = child.call(this, topic, args, queue);
				result = hub.merge(result, childResult);
				if (child.aborted) {
					callChain.aborted = true;
					break;
				}
			}
			return result;
		}
		callChain.matches = function (topic) {
			return chainTopicMatcher.test(topic);
		};
		callChain.getTopic = function () {
			return chainTopic;
		};
		callChain.add = function (fn, topic, topicMatcher) {
			if (chainTopic === topic) {
				fns.add(fn);
				return;
			}
			var newChild, i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					child.add(fn, topic, topicMatcher);
					return;
				}
				if (!topicMatcher) {
					topicMatcher = pathMatcher(topic);
				}
				if (topicMatcher.test(child.getTopic())) {
					newChild = topicChain(topic, child);
					newChild.add(fn, topic, topicMatcher);
					children[i] = newChild;
					return;
				}
			}
			newChild = topicChain(topic);
			newChild.add(fn, topic);
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
		callChain.remove = function (fn, topic) {
			if (chainTopic === topic) {
				return fns.remove(fn);
			}
			var i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					if (child.remove(fn, topic)) {
						return true;
					}
				}
			}
			return false;
		};
		return callChain;
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
	
	// ensures the given argument is a function. Throws an error otherwise.
	function validateCallback(fn) {
		var fnType = typeof fn;
		if (fnType !== "function") {
			throw new TypeError("Callback is " + fnType);
		}
	}
	
	/**
	 * The root topic chain.
	 *
	 * @type {Function}
	 */
	var rootChain = topicChain();
	
	// Public API:
	
	hub.topicChain = topicChain; // exposed for unit testing only.
	hub.topicComparator = topicComparator;
	
	/**
	 * resets the hub to it's initial state. Primarily required for unit
	 * testing.
	 */
	hub.reset = function () {
		rootChain = topicChain();
		hub.resetPeers();
		hub.resetPromise();
	};
	
	/**
	 * subscribes a callback function to the given topic.
	 * 
	 * @param {string} topic the topic.
	 * @param {function (object)} fn the callback function.
	 */
	hub.subscribe = function (topic, fn) {
		validateCallback(fn);
		validateTopic(topic);
		rootChain.add(fn, topic);
	};
	
	/**
	 * unsubscribes a callback function from the given topic.
	 *
	 * @param {string} topic the topic.
	 * @param {function (object)} fn the callback function.
	 * @return {Boolean} false if the callback was not registered, otherwise
	 *			true.
	 */
	hub.unsubscribe = function (topic, fn) {
		validateCallback(fn);
		validateTopic(topic);
		return rootChain.remove(fn, topic);
	};
	
	/**
	 * invokes the call chain associated with a topic with optional arguments.
	 * The topic combines a namespace and a message in the form:
	 * "{namespace}/{message}".
	 * 
	 * @param {String} topic the topic.
	 * @param {...Object} args the arguments to pass.
	 */
	hub.invoke = function (topic) {
		validateTopic(topic);
		var args = Array.prototype.slice.call(arguments, 1);
		if (topic.indexOf("{") !== -1) {
			topic = hub.substitute(topic, args);
		}
		try {
			return rootChain(topic, args);
		} catch (e) {
			throw new hub.Error("error",
				"Error in call chain for topic \"{topic}\": {error}", {
					topic: topic,
					error: e.message
				});
		}
	};
	
}());
