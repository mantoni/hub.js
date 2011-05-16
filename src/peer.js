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
	
	/*
	 * returns a function that publishes the given topic on the hub and then
	 * invokes the provided chain if the topic was not aborted on the hub.
	 */
	function interceptor(topic, chain, scope) {
		return function () {
			var args = Array.prototype.slice.call(arguments);
			var result = hub.publish.apply(hub, [topic].concat(args));
			if (!hub.aborted()) {
				result = hub.merge(result, chain.apply(scope, arguments));
			}
			return result;
		};
	}
	
	var createPeer;
	
	/*
	 * returns a peer instance for the definition with the given topic.
	 */
	function getPeer(namespace, args) {
		var peer = peers[namespace];
		if (peer) {
			return peer;
		}
		var definition = definitions[namespace];
		if (!definition) {
			throw new Error("Peer is not defined: " + namespace);
		}
		peer = createPeer(definition, args);
		var api = {};
		var message;
		for (message in peer) {
			if (peer.hasOwnProperty(message)) {
				var chain = peer[message];
				if (typeof chain === "function") {
					var topic = namespace + "/" + message;
					api[message] = interceptor(topic, chain, api);
				}
			}
		}
		peer.api = api;
		return peer;
	}
	
	/*
	 * creates a peer for the peer definition with the given name.
	 */
	createPeer = function createPeer(definition, args) {
		var peer = {};
		var is = definition.is;
		var i, l;
		for (i = 0, l = is.length; i < l; i++) {
			hub.mix(peer, getPeer(is[i]));
		}
		var instance = definition.instance;
		if (!instance) {
			instance = hub.object(definition.factory, args);
		}
		hub.mix(peer, instance);
		return peer;
	};
	
	function subscriber(chain, scope) {
		return function () {
			return chain.apply(scope, arguments);
		};
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
	 * @param {String|Array} is the optional list of peer names to mix
	 * @param {Function} factory the factory for the map of listeners
	 */
	hub.peer = function (namespace, is, factory) {
		if (definitions[namespace]) {
			throw new Error("hub - peer already defined: " + namespace);
		}
		if (!factory) {
			factory = is;
			is = null;
		}
		var definition = {
			is: is ? (typeof is === "string" ? [is] : is) : emptyArray
		};
		if (typeof factory === "function") {
			definition.factory = factory;
		} else {
			definition.instance = factory;
			var peer = peers[namespace] = createPeer(definition);
			var api = peer.api = {};
			var message;
			for (message in peer) {
				if (peer.hasOwnProperty(message)) {
					var chain = peer[message];
					if (typeof chain === "function") {
						var topic = namespace + "/" + message;
						hub.subscribe(topic, subscriber(chain, api));
						api[message] = hub.publisher(topic);
					}
				}
			}
		}
		definitions[namespace] = definition;
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
		return getPeer(namespace, args).api;
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
