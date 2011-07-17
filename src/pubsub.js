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
		hub.root = hub.node();
	};
	
}());
