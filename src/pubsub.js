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
	var array_slice = Array.prototype.slice;
	
	function isObject(object) {
		return Object.prototype.toString.call(object) === "[object Object]";
	}
	
	function onAll(topicPrefix, object) {
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
	
	function scoped(topic, fn) {
		topic += ".";
		return function () {
			var args = array_slice.call(arguments);
			if (!args[0]) {
				throw new TypeError("Topic is " + args[0]);
			}
			args[0] = topic + args[0];
			return fn.apply(this, args);
		};
	}
	
	/**
	 * subscribes a callback function to the given topic.
	 * 
	 * @param {string} topic the topic.
	 * @param {function (object)} fn the callback function.
	 */
	hub.on = function (topic, fn) {
		if (typeof topic === "function") {
			hub.root.add("**", topic);
		}
		else if (isObject(topic)) {
			onAll("", topic);
			return;
		}
		else if (isObject(fn)) {
			onAll(topic + ".", fn);
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
	hub.un = function (topic, fn) {
		if (typeof topic === "function") {
			return hub.root.remove("**", topic);
		}
		return hub.root.remove(topic, fn);
	};
	
	hub.topicScope = function (topic, scope) {
		if (!scope) {
			scope = hub.scope();
		}
		var cache = scopeFunctionCache[topic];
		if (!cache) {
			cache = {
				on: scoped(topic, hub.on),
				un: scoped(topic, hub.un),
				peer: scoped(topic, hub.peer),
				emit: scoped(topic, hub.emit),
				create: scoped(topic, hub.create)
			};
			scopeFunctionCache[topic] = cache;
		}
		scope.on = cache.on;
		scope.un = cache.un;
		scope.peer = cache.peer;
		scope.emit = cache.emit;
		scope.create = cache.create;
		return scope;
	};
	
	/**
	 * invokes the call chain associated with a topic with optional arguments.
	 * The topic combines a namespace and a message in the form:
	 * "{namespace}/{message}".
	 * 
	 * @param {String} topic the topic.
	 * @param {...Object} args the arguments to pass.
	 */
	hub.emit = function (topic) {
		hub.validateTopic(topic);
		var args = array_slice.call(arguments);
		var slicedArgs = args.slice(1);
		if (topic.indexOf("{") !== -1) {
			args[0] = hub.substitute(topic, slicedArgs);
		}
		var thiz = this.propagate ? this : hub.scope(slicedArgs);
		thiz = hub.topicScope(args[0], thiz);
		var result;
		try {
			result = hub.root.apply(thiz, args);
		} catch (e) {
			throw new hub.Error("error",
				"Error in call chain for topic \"{topic}\": {error}", {
					topic: args[0],
					error: e.message
				});
		}
		if (!result || !result.then) {
			var promise = hub.promise(0, thiz);
			promise.resolve(result);
			result = promise;
		}
		return result;
	};
	
	/**
	 * <p>
	 * defines a peer in the hub that emits and receives messages.
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
	
	/**
	 * resets the hub to it's initial state. Primarily required for unit
	 * testing.
	 */
	hub.reset = function () {
		scopeFunctionCache = {};
		hub.root = hub.topicChain();
	};
	
}());
