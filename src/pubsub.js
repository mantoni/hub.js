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
	 * The root node.
	 *
	 * @type {Object}
	 */
	hub.root = hub.node();
	
	var scopeFunctionCache = {};
	var array_slice = Array.prototype.slice;
	
	function isObject(object) {
		return Object.prototype.toString.call(object) === "[object Object]";
	}
	
	function onAll(topicPrefix, object) {
		var k;
		for (k in object) {
			if (object.hasOwnProperty(k)) {
				hub.root.on(topicPrefix + k, object[k]);
			}
		}
	}
	
	function getter(object) {
		return function () {
			return object;
		};
	}
	
	function scoped(topic, fn) {
		if (topic) {
			topic += ".";
		}
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
			hub.root.on("**", topic);
		} else if (isObject(topic)) {
			onAll("", topic);
			return;
		} else if (isObject(fn)) {
			onAll(topic + ".", fn);
			fn = getter(fn);
		}
		hub.root.on(topic, fn);
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
			return hub.root.un("**", topic);
		}
		return hub.root.un(topic, fn);
	};
	
	hub.topicScope = function (topic, scope) {
		if (!scope) {
			scope = hub.scope();
		}
		var p = topic.lastIndexOf(".");
		var namespace = p === -1 ? "" : topic.substring(0, p);
		var cache = scopeFunctionCache[namespace];
		if (!cache) {
			cache = {
				topic: getter(topic),
				on: scoped(namespace, hub.on),
				un: scoped(namespace, hub.un),
				peer: scoped(namespace, hub.peer),
				emit: scoped(namespace, hub.emit),
				create: scoped(namespace, hub.create),
				factory: scoped(namespace, hub.factory)
			};
			scopeFunctionCache[namespace] = cache;
		}
		scope.topic = cache.topic;
		scope.on = cache.on;
		scope.un = cache.un;
		scope.peer = cache.peer;
		scope.emit = cache.emit;
		scope.create = cache.create;
		scope.factory = cache.factory;
		return scope;
	};
	
	/**
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
			result = hub.root.emit.apply(thiz, args);
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
	 * @param {String} topic the topic
	 * @param {Function} factory the factory
	 * @param {Array} args the optional arguments
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
		hub.root = hub.node();
	};
	
}());
