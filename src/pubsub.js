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
	
	/**
	 * The root topic chain.
	 *
	 * @type {Function}
	 */
	hub.root = hub.topicChain();
	
	var scopeFunctionCache = {};
	
	/**
	 * resets the hub to it's initial state. Primarily required for unit
	 * testing.
	 */
	hub.reset = function () {
		scopeFunctionCache = {};
		hub.root = hub.topicChain();
		hub.resetPromise();
	};
	
	function isObject(object) {
		return Object.prototype.toString.call(object) === "[object Object]";
	}
	
	function subscribeAll(topicPrefix, object) {
		var k;
		for (k in object) {
			if (object.hasOwnProperty(k)) {
				hub.root.add(topicPrefix + k, object[k]);
			}
		}
	}
	
	function getter(object) {
		return function () {
			return object;
		};
	}
	
	function scoped(topic, property) {
		var fn = hub[property];
		topic += ".";
		return function () {
			var args = Array.prototype.slice.call(arguments);
			args[0] = topic + args[0];
			return fn.apply(this, args);
		};
	}
	
	function enrichScope(scope, topic) {
		var cache = scopeFunctionCache[topic];
		if (!cache) {
			cache = {
				on: scoped(topic, "on"),
				un: scoped(topic, "un"),
				peer: scoped(topic, "peer"),
				publish: scoped(topic, "publish")
			};
			cache.subscribe = cache.on;
			cache.unsubscribe = cache.un;
			scopeFunctionCache[topic] = cache;
		}
		var k;
		for (k in cache) {
			if (cache.hasOwnProperty(k)) {
				scope[k] = cache[k];
			}
		}
	}
	
	/**
	 * subscribes a callback function to the given topic.
	 * 
	 * @param {string} topic the topic.
	 * @param {function (object)} fn the callback function.
	 */
	hub.subscribe = hub.on = function (topic, fn) {
		if (isObject(topic)) {
			subscribeAll("", topic);
			return;
		}
		if (isObject(fn)) {
			subscribeAll(topic + ".", fn);
			fn = getter(fn);
		}
		hub.root.add(topic, fn);
	};
	
	/**
	 * unsubscribes a callback function from the given topic.
	 *
	 * @param {string} topic the topic.
	 * @param {function (object)} fn the callback function.
	 * @return {Boolean} false if the callback was not registered, otherwise
	 *			true.
	 */
	hub.unsubscribe = hub.un = function (topic, fn) {
		return hub.root.remove(topic, fn);
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
		hub.validateTopic(topic);
		var args = Array.prototype.slice.call(arguments);
		var slicedArgs = args.slice(1);
		if (topic.indexOf("{") !== -1) {
			args[0] = hub.substitute(topic, slicedArgs);
		}
		var thiz = this.propagate ? this : hub.scope(slicedArgs);
		enrichScope(thiz, args[0]);
		try {
			return hub.root.apply(thiz, args);
		} catch (e) {
			throw new hub.Error("error",
				"Error in call chain for topic \"{topic}\": {error}", {
					topic: args[0],
					error: e.message
				});
		}
	};
	
	/**
	 * <p>
	 * defines a peer in the hub that publishes and receives messages.
	 * </p>
	 * <p>
	 * Configuration parameters:
	 * </p>
	 * <ul>
	 * <li>is (String|Array): single peer name or list of peer names this peer
	 * inherits from</li>
	 * <li>scope (String): the peer scope, either hub.SINGLETON or
	 * hub.PROTOTYPE. Defaults to hub.SINGLETON.</li>
	 * </ul>
	 * 
	 * @param {String} namespace the namespace for the peer
	 * @param {Function} factory the factory for the map of listeners
	 */
	hub.peer = function (topic, factory, args) {
		var object;
		if (typeof topic === "function") {
			object = hub.create(topic, factory);
			if (object) {
				hub.on(object);
			}
		} else if (typeof factory === "function") {
			object = hub.create(topic, factory, args);
			if (object) {
				hub.on(topic, object);
			}
		} else {
			hub.on(topic, factory);
		}
	};
	
}());
