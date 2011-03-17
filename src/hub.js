/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * 
 */
(function() {
	
	/**
	 * topic to subscriber functions.
	 *
	 * @type {object}
	 */
	var subscribers = {};
	var wildcardSubscribers = {};
	
	/**
	 * All peer instances that have been created.
	 *
	 * @type {object}
	 */
	var peers = {};
	
	/**
	 * All peer or aspect definitions.
	 *
	 * @type {object}
	 */
	var definitions = {};
	
	/**
	 * An empty array used as an internal value object.
	 *
	 * @type {Array}
	 */
	var emptyArray = [];
	
	/*
	 * adds a function to the given peer under the specified message.
	 */
	function apply(peer, message, fn) {
		var c = peer[message];
		if(!c) {
			peer[message] = c = Hub.util.chain();
		}
		c.add(fn);
	}
	
	/*
	 * applies a mix-in to a peer.
	 */
	function mix(peer, mixin) {
		for(var message in mixin) {
			apply(peer, message, mixin[message]);
		}
	}
	
	/*
	 * converts the given argument to an array if necessary.
	 */
	function argArray(arg) {
		return arg ? (typeof arg === "string" ? [arg] : arg) : emptyArray;
	}
	
	/*
	 * creates a peer for the peer definition with the given name.
	 */
	function createPeer(definition) {
		var peer = {};
		if(definition) {
			var is = definition.is;
			for(var i = 0, mixin; mixin = is[i++];) {
				mix(peer, getPeer(mixin));
			}
			mix(peer, definition.instance || definition.factory());
		}
		return peer;
	}
	
	function pathMatcher(name) {
		var exp = name.replace(/\./g, "\\.").replace(
			/\*\*/g, "[a-zA-Z0-9\\.]+").replace(/\*/g, "[a-zA-Z0-9]+");
		return new RegExp("^" + exp + "$");
	}
	
	/*
	 * returns a peer instance for the definition with the given topic.
	 */
	function getPeer(namespace) {
		return peers[namespace] || createPeer(definitions[namespace]);
	}
	
	function peerFactory(namespace) {
		return function() {
			var peer = createPeer(definitions[namespace]);
			wirePeer(peer, namespace);
			try {
				return Hub.propagate();
			}
			finally {
				unwirePeer(peer, namespace);
			}
		};
	}
	
	function wirePeer(peer, namespace) {
		for(var message in peer) {
			var fn = peer[message];
			if(typeof fn === "function") {
				Hub.subscribe(namespace + "/" + message, fn);
			}
		}
	}
	
	function unwirePeer(peer, namespace) {
		for(var message in peer) {
			var fn = peer[message];
			if(typeof fn === "function") {
				Hub.unsubscribe(namespace + "/" + message, fn);
			}
		}
	}
	
	function substitutionFn(topic) {
		return function() {
			invoke(Hub.util.substitute(topic, arguments), arguments);
		};
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
	
	function getWildcardSubscriber(topic) {
		var o = wildcardSubscribers[topic];
		if(!o) {
			o = wildcardSubscribers[topic] = {
				re: pathMatcher(topic),
				chain: Hub.util.chain()
			};
			addAllToMatchingChain(subscribers, o.chain, o.re, null);
		}
		return o;
	}
	
	function addToMatchingChain(map, fn, re, topic) {
		for(var t in map) {
			var o = map[t];
			if((re || o.re).test(topic)) {
				o.chain.add(fn, topic);
			}
		}
	}
	
	function addAllToMatchingChain(map, chain, re, topic) {
		for(var t in map) {
			var o = map[t];
			if((re || o.re).test(topic || t)) {
				(chain || o.chain).add(o.chain, t);
			}
		}
	}
	
	function storeChain(topic, chain) {
		subscribers[topic] = {
			chain: chain
		};
		return chain;
	}
	
	function createTopicChain(topic) {
		validateTopic(topic);
		var chain = storeChain(topic, Hub.util.topicChain());
		addAllToMatchingChain(wildcardSubscribers, chain, null, topic);
		return chain;
	}
	
	function invoke(topic, args) {
		var chain;
		var o = subscribers[topic];
		if(o) {
			chain = o.chain;
		}
		else {
			if(topic.indexOf("{") !== -1) {
				chain = storeChain(topic, substitutionFn(topic));
			}
			else if(topic.indexOf("*") === -1) {
				chain = createTopicChain(topic);
			}
			else {
				chain = getWildcardSubscriber(topic).chain;
			}
		}
		try {
			return chain.apply(null, args);
		}
		catch(e) {
			var errorTopic = "hub.error/publish";
			if(topic === errorTopic) {
				throw e;
			}
			invoke(errorTopic, [new Hub.Error("error",
				"Error in call chain for topic \"{topic}\": {error}", {
					topic: topic, error: e.message
				})]
			);
		}
	}
	
	// ensures the given argument is a function. Throws an error otherwise.
	function validateCallback(fn) {
		var fnType = typeof fn;
		if(fnType !== "function") {
			throw new Error("Callback is not function: " + fnType);
		}
	}
	
	// Public API:
	
	/**
	 * resets the Hub to it's initial state. Primarily required for unit
	 * testing.
	 */
	Hub.reset = function() {
		subscribers = {};
		wildcardSubscribers = {};
		peers = {};
		for(var k in definitions) {
			if(k.indexOf("lib.") === -1) {
				delete definitions[k];
			}
		}
	};
	
	/**
	 * subscribes a callback function to the given topic.
	 * 
	 * @param {string} topic the topic.
	 * @param {function(object)} fn the callback function.
	 */
	Hub.subscribe = function(topic, fn) {
		validateCallback(fn);
		var isWildcard = topic.indexOf("*") !== -1;
		var t, re, chain;
		var o = subscribers[topic];
		if(o) {
			chain = o.chain;
		}
		else {
			if(isWildcard) {
				o = getWildcardSubscriber(topic);
				o.chain.add(fn);
				addToMatchingChain(subscribers, fn, o.re, topic);
				return;
			}
			chain = createTopicChain(topic);
		}
		if(!isWildcard) {
			addToMatchingChain(wildcardSubscribers, fn, null, topic);
		}
		chain.add(fn, topic);
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
		var o = subscribers[topic];
		if(!o) {
			validateTopic(topic);
			return false;
		}
		o.chain.remove(fn);
		for(var t in wildcardSubscribers) {
			var sub = wildcardSubscribers[t];
			if(sub.re.test(topic)) {
				sub.chain.remove(fn);
			}
		}
		return true;
	};
	
	/**
	 * <p>
	 * defines a peer in the Hub that publishes and receives messages.
	 * </p>
	 * <p>
	 * Configuration parameters:
	 * </p>
	 * <ul>
	 * <li>is (String|Array): single peer name or list of peer names this peer
	 * inherits from</li>
	 * <li>scope (String): the peer scope, either Hub.SINGLETON or
	 * Hub.PROTOTYPE. Defaults to Hub.SINGLETON.</li>
	 * </ul>
	 * 
	 * @param {String} namespace the namespace for the peer
	 * @param {String|Array} is the optional list of peer names to mix
	 * @param {Function} factory the factory for the map of listeners
	 */
	Hub.peer = function(namespace, is, factory) {
		if(definitions[namespace]) {
			throw new Error("Hub - peer already defined: " + namespace);
		}
		if(!factory) {
			factory = is;
			is = null;
		}
		var definition = {
			is: argArray(is)
		};
		if(typeof factory === "function") {
			definition.factory = factory;
			Hub.subscribe(namespace + "/**", peerFactory(namespace));
		}
		else {
			definition.instance = factory;
			var peer = peers[namespace] = createPeer(definition);
			wirePeer(peer, namespace);
		}
		definitions[namespace] = definition;
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
		var args = arguments.length > 1 ?
				Array.prototype.slice.call(arguments, 1) : emptyArray;
		return invoke(topic, args);
	};
	
	/**
	 * defines a forward for a topic. This allows to define a general purpose
	 * listener or peer and reuse it on different namespaces and messages.
	 * Publishing on a namespace / message pair that matches the forward will
	 * trigger the subscribers on the "real" topic.
	 * 
	 * @param {String} alias the alias for the topic.
	 * @param {String} topic the topic.
	 * @param {Function} dataTransformer the optional function to transform
	 * 			the data on the callback
	 * @param {Object} dataToMerge the optional data to merge with the data
	 * 			on the callback.
	 */
	Hub.forward = function(alias, topic, dataTransformer, dataToMerge) {
		if(typeof alias === "object") {
			for(var k in alias) {
				var t = alias[k];
				if(typeof t === "string") {
					Hub.subscribe(k, Hub.publisher(t));
				}
				else {
					Hub.subscribe(k, Hub.publisher(t[0], t[1], t[2]));
				}
			}
		}
		else {
			Hub.subscribe(alias, Hub.publisher(topic, dataTransformer,
					dataToMerge));
		}
	};
	
	/**
	 * creates a publisher function for a topic. The returned function
	 * publishes the given topic on the hub when invoked.
	 * 
	 * @param {String} topic the topic´to publish.
	 * @param {Function} dataTransformer the optional function to transform
	 * 			the data on the callback
	 * @param {Object} dataToMerge the optional data to merge with the data on
	 * 			the callback
	 * @return {Function} the forwarder function
	 */
	Hub.publisher = function(topic, dataTransformer, dataToMerge) {
		if(dataTransformer) {
			if(dataToMerge) {
				return function() {
					return Hub.publish(topic, Hub.util.merge(
						dataTransformer.apply(null, arguments),
						dataToMerge)
					);
				}
			}
			if(typeof dataTransformer === "function") {
				return function() {
					return Hub.publish(topic,
						dataTransformer.apply(null, arguments)
					);
				}
			}
			return function(data) {
				return Hub.publish(topic,
					Hub.util.merge(data, dataTransformer)
				);
			}
		}
		return function(data) {
			return Hub.publish(topic, data);
		};
	};
	
	/**
	 * creates a new error for the given type, description and optional
	 * context. The description might contain placeholders that get replaced
	 * by values from the context using Hub.util.substitute when calling
	 * toString on the error. The type and context properties are exposed
	 * while the description is not.
	 *
	 * @param {String} type the type of the error.
	 * @param {String} description the description of the error.
	 * @param {Object} context the context for the error.
	 */
	Hub.Error = function(type, description, context) {
		function toString() {
			return Hub.util.substitute(description, this.context);
		}
		return {
			toString: toString,
			type: type,
			context: context || {}
		};
	};
	
	/**
	 * merges the source object into the target object.
	 *
	 * @param {*} target the target value or object
	 * @param {*} source the source value or object
	 * @return {*} the new target value or object
	 */
	Hub.util.merge = function(target, source) {
		if(target === undefined || target === null ||
				target === source) {
			return source;
		}
		if(source === undefined || source === null) {
			return target;
		}
		var toString = Object.prototype.toString;
		var sourceType = toString.call(source);
		var targetType = toString.call(target);
		if(targetType === sourceType) {
			if(sourceType === "[object Object]") {
				for(var k in source) {
					target[k] = arguments.callee(target[k], source[k]);
				}
				return target;
			}
			if(sourceType === "[object Array]") {
				return target.concat(source);
			}
		}
		invoke("hub.error/util.merge", [new Hub.Error("validation",
			targetType === sourceType ?
				"Cannot merge value {target} with {source}" :
				"Cannot merge type {targetType} with {sourceType}", {
					target: target,
					source: source,
					targetType: targetType,
					sourceType: sourceType
				}
		)]);
		return target;
	};
	
	/**
	 * resolves a dot notation path from an object. If the path cannot be
	 * resolved, the optional return value is returned.
	 *
	 * @param {Object|Array} object the object.
	 * @param {String} path the path.
	 * @param {*} defaultValue the optional default value.
	 * @return {*} the resolved value or the default value.
	 */
	Hub.util.resolve = function(object, path, defaultValue) {
		var p = path.indexOf(".");
		if(p !== -1) {
			var key = path.substring(0, p);
			if(key in object) {
				return arguments.callee(object[key],
					path.substring(p + 1), defaultValue);
			}
			return defaultValue;
		}
		return path in object ? object[path] : defaultValue;
	};
	
	/**
	 * substitutes the given string with the given values by searching for
	 * placeholders in the form {dot.separated.path}. If a placeholder is
	 * found, Hub.util.resolve is used to resolve the value from the given
	 * values object or array.
	 *
	 * @param {String} string the string to substitute.
	 * @param {Object|Array} values the provided values.
	 * @param {*} defaultValue the optional default value.
	 * @return {String} the substituted string.
	 */
	Hub.util.substitute = function(string, values, defaultValue) {
		if(defaultValue === undefined) {
			defaultValue = "";
		}
		var replaceFn = values ? function(match, path) {
			return Hub.util.resolve(values, path, defaultValue);
		} : function() {
			return defaultValue;
		};
		return string.replace(/\{([a-zA-Z0-9\.]+)\}/g, replaceFn);
	};

	
}());