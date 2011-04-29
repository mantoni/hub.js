/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 *
 */
(function() {
	
	var rootTopic = "**/**";
	
	function pathMatcher(name) {
		var exp = name.replace(/\./g, "\\.").replace(
			/\*\*/g, "([a-zA-Z0-9\\.#]+|##)").replace(
			/\*/g, "([a-zA-Z0-9\\*]+)").replace(/#/g, "\\*");
		return new RegExp("^" + exp + "$");
	}
	
	function topicChain(chainTopic) {
		if(!chainTopic) {
			chainTopic = rootTopic;
		}
		var chainTopicMatcher = pathMatcher(chainTopic);
		var fns = Hub.chain();
		var children = [];
		var callChain = function(topic, args, queue) {
			if(!topic) {
				topic = chainTopic;
			}
			if(topic !== rootTopic && !chainTopicMatcher.test(topic)) {
				if(topic.indexOf("*") === -1 ||
						!pathMatcher(topic).test(chainTopic)) {
					return;
				}
				topic = rootTopic;
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
				result = Hub.merge(result, child(topic, args, queue));
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
	
	function validateTopic(topic) {
		var type = typeof topic;
		if(type !== "string") {
			throw new Error("Topic is not string: " + type);
		}
		if(!topic) {
			throw new Error("Topic is empty");
		}
		if(!(/^[a-zA-Z0-9\.\{\}\*]+(\/[a-zA-Z0-9\.\{\}\*]+)?$/.test(topic))) {
			throw new Error("Illegal topic: " + topic);
		}
	}
	
	// ensures the given argument is a function. Throws an error otherwise.
	function validateCallback(fn) {
		var fnType = typeof fn;
		if(fnType !== "function") {
			throw new Error("Callback is " + fnType);
		}
	}
	
	/**
	 * The root topic chain.
	 *
	 * @type {Function}
	 */
	var rootChain = topicChain();

	// Public API:
	
	/**
	 * resets the Hub to it's initial state. Primarily required for unit
	 * testing.
	 */
	Hub.reset = function() {
		rootChain = topicChain();
		Hub.resetPeers();
	};
	
	/**
	 * subscribes a callback function to the given topic.
	 * 
	 * @param {string} topic the topic.
	 * @param {function(object)} fn the callback function.
	 */
	Hub.subscribe = function(topic, fn) {
		validateCallback(fn);
		validateTopic(topic);
		rootChain.add(fn, topic);
	};
	
	/**
	 * unsubscribes a callback function from the given topic.
	 *
	 * @param {string} topic the topic.
	 * @param {function(object)} fn the callback function.
	 * @return {Boolean} false if the callback was not registered, otherwise
	 * 				true.
	 */
	Hub.unsubscribe = function(topic, fn) {
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
	Hub.invoke = function(topic) {
		validateTopic(topic);
		var args = Array.prototype.slice.call(arguments, 1);
		if(topic.indexOf("{") !== -1) {
			topic = Hub.substitute(topic, args);
		}
		try {
			return rootChain(topic, args);
		}
		catch(e) {
			throw new Hub.Error("error",
				"Error in call chain for topic \"{topic}\": {error}", {
					topic: topic, error: e.message
				});
		}
	};
	
	/**
	 * whether the last publish was aborted or not.
	 *
	 * @return {Boolean} true if the last publish was aborted.
	 */
	Hub.aborted = function() {
		return Boolean(rootChain.aborted);
	};
	
	Hub.topicChain = topicChain; // exposed for unit testing only.
	
}());
