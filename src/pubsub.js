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
				topic: topic,
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
		return hub.root.emit.apply(hub.root, arguments);
	};
	
	/**
	 * @param {String} topic the topic
	 * @param {Function} factory the factory
	 * @param {Array} args the optional arguments
	 */
	hub.peer = function () {
		return hub.root.peer.apply(hub.root, arguments);
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
