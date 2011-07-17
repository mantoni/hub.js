/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
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
	
	function isObject(object) {
		return Object.prototype.toString.call(object) === "[object Object]";
	}
	
	function getter(object) {
		return function () {
			return object;
		};
	}

	function onAll(thiz, topicPrefix, object) {
		var key;
		for (key in object) {
			if (object.hasOwnProperty(key)) {
				thiz.on(topicPrefix + key, object[key]);
			}
		}
	}
	
	var nodeProto = {
		create: hub.create,
		factory: hub.factory,
		peer: function (topic, factory, args) {
			var object;
			if (typeof topic === "function") {
				object = hub.create(topic, factory);
				if (object) {
					this.on(object);
				}
			} else if (typeof factory === "function") {
				object = hub.create(topic, factory, args);
				if (object) {
					this.on(topic, object);
				}
			} else {
				this.on(topic, factory);
			}
		}
	};
	
	var rootTopic = "**";
	
	function node(chainTopic, firstChild) {
		var initializer;
		if (!chainTopic) {
			chainTopic = rootTopic;
		} else {
			if (typeof chainTopic === "string") {
				validateTopic(chainTopic);
			} else {
				initializer = chainTopic;
				chainTopic = rootTopic;
			}
		}
		var chainTopicMatcher = pathMatcher(chainTopic);
		var chain;
		var children = firstChild ? [firstChild] : [];
		var thiz = Object.create(nodeProto);
		thiz.emit = function (topic) {
			if (arguments.length) {
				hub.validateTopic(topic);
			} else {
				topic = chainTopic;
			}
			var slicedArgs = Array.prototype.slice.call(arguments, 1);
			if (topic.indexOf("{") !== -1) {
				topic = hub.substitute(topic, slicedArgs);
			}
			if (topic !== rootTopic && !chainTopicMatcher.test(topic)) {
				if (topic.indexOf("*") === -1 ||
						!pathMatcher(topic).test(chainTopic)) {
					return;
				}
				topic = rootTopic;
			}
			var thiz = this.propagate ? this : hub.scope(slicedArgs);
			thiz = hub.topicScope(topic, thiz);
			if (chain) {
				chain.call(thiz);
			}
			if (thiz.aborted) {
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
				child.emit.call(thiz, topic);
				if (thiz.aborted) {
					break;
				}
			}
			return thiz.result();
		};
		thiz.matches = function (topic) {
			return chainTopicMatcher.test(topic);
		};
		thiz.topic = chainTopic;
		thiz.on = function (topic, fn, topicMatcher) {
			if (typeof topic === "function") {
				thiz.on(chainTopic, topic);
				return;
			} else if (isObject(topic)) {
				onAll(thiz, "", topic);
				return;
			} else if (isObject(fn)) {
				onAll(thiz, topic + ".", fn);
				fn = getter(fn);
			}
			if (chainTopic === topic) {
				if (!chain) {
					chain = hub.chain();
				}
				chain.on(fn);
				return;
			}
			var newChild, i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					child.on(topic, fn, topicMatcher);
					return;
				}
				if (!topicMatcher) {
					topicMatcher = pathMatcher(topic);
				}
				if (topicMatcher.test(child.topic)) {
					newChild = node(topic, child);
					newChild.on(topic, fn, topicMatcher);
					children[i] = newChild;
					return;
				}
			}
			newChild = node(topic);
			newChild.on(topic, fn);
			if (topic.indexOf("*") === -1) {
				children.unshift(newChild);
			} else {
				for (i = 0, l = children.length; i < l; i++) {
					var childTopic = children[i].topic;
					var result = topicComparator(childTopic, topic);
					if (result !== -1) {
						children.splice(i, 0, newChild);
						return;
					}
				}
				children.push(newChild);
			}
		};
		thiz.un = function (topic, fn) {
			if (typeof topic === "function") {
				return thiz.un("**", topic);
			}
			if (chainTopic === topic) {
				return chain ? chain.un(fn) : -1;
			}
			var i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					if (child.un(topic, fn)) {
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
		thiz.mix = function (topic) {
			if (typeof topic === "string") {
				hub.apply("emit", arguments).then(thiz.does.on());
			} else {
				thiz.on(topic);
			}
			return thiz;
		};
		thiz.does = new hub.Does(thiz);
		if (initializer) {
			onAll(thiz, "", initializer);
		}
		return thiz;
	}

	hub.node = node;
	hub.topicComparator = topicComparator;
	hub.validateTopic = validateTopic;

}());