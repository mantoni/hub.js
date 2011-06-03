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
