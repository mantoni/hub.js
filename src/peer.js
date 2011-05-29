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
	 * All peer instances that have been created.
	 *
	 * @type {object}
	 */
	var peers = {};
	
	/**
	 * All peer definitions.
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
	
	function subscriber(chain, scope) {
		return function () {
			return chain.apply(scope, arguments);
		};
	}
	
	function wire(peer, namespace, isProto) {
		var api = peer.api = {};
		var message;
		for (message in peer) {
			if (peer.hasOwnProperty(message)) {
				var fn = peer[message];
				if (typeof fn === "function") {
					var topic = namespace + "." + message;
					var pub = hub.publisher(topic);
					if (isProto) {
						api[message] = hub.chain(pub, fn);
					} else {
						api[message] = pub;
						var sub = subscriber(fn, api);
						hub.subscribe(topic, sub);
					}
				}
			}
		}
		hub.publish("hub.peer.new." + namespace, api);
	}

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
	hub.peer = function (namespace, factory) {
		if (definitions[namespace]) {
			throw new Error("Peer \"" + namespace + "\" already defined");
		}
		var definition = {};
		if (typeof factory === "function") {
			definition.factory = factory;
		} else {
			peers[namespace] = factory;
			wire(factory, namespace, false);
		}
		definitions[namespace] = definition;
	};
	
	hub.singleton = function (namespace, fn, args) {
		hub.peer(namespace, typeof fn === "function" ?
			hub.create(namespace, fn, args) : fn);
	};
	
	/**
	 * <p>
	 * returns the API of the peer with the given namespace. The returned
	 * object implements all messages of the peer as methods that can be
	 * directly invoked.
	 * </p>
	 * <p>
	 * If the peer with the given namespace is a prototype peer, a new
	 * instance is created.
	 * </p>
	 *
	 * @param {String} namespace the namespace.
	 * @return {Object} the API of the peer.
	 */
	hub.get = function (namespace) {
		var args = arguments.length === 1 ? emptyArray :
			Array.prototype.slice.call(arguments, 1);		
		var peer = peers[namespace];
		if (peer) {
			return peer.api;
		}
		var definition = definitions[namespace];
		if (!definition) {
			throw new Error("Peer is not defined: " + namespace);
		}
		peer = hub.create(namespace, definition.factory, args);
		wire(peer, namespace, true);
		return peer.api;
	};
	
	hub.resetPeers = function () {
		peers = {};
		var k;
		for (k in definitions) {
			if (definitions.hasOwnProperty(k)) {
				if (k.indexOf("lib.") === -1) {
					delete definitions[k];
				}
			}
		}
	};
	
}());
