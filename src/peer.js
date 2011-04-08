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
	 * adds a function to the given peer under the specified message.
	 */
	function apply(peer, message, fn) {
		var c = peer[message];
		if(!c) {
			peer[message] = c = Hub.chain();
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
	
	function interceptor(topic, chain) {
		return Hub.multiChain(Hub.noop, [
			Hub.subscriberChain(topic), chain]);
	}
	
	/*
	 * returns a peer instance for the definition with the given topic.
	 */
	function getPeer(namespace) {
		var peer = peers[namespace];
		if(peer) {
			return peer;
		}
		var definition = definitions[namespace];
		if(!definition) {
			throw new Error("Peer is not defined: " + namespace);
		}
		peer = createPeer(definition);
		var api = {};
		for(var message in peer) {
			var chain = peer[message];
			if(typeof chain === "function") {
				api[message] = interceptor(namespace + "/" + message, chain);
			}
		}
		peer.api = api;
		return peer;
	}

	/*
	 * creates a peer for the peer definition with the given name.
	 */
	function createPeer(definition) {
		var peer = {};
		var is = definition.is;
		for(var i = 0, mixin; mixin = is[i++];) {
			mix(peer, getPeer(mixin));
		}
		mix(peer, definition.instance || definition.factory());
		return peer;
	}
	
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
			is: is ? (typeof is === "string" ? [is] : is) : emptyArray
		};
		if(typeof factory === "function") {
			definition.factory = factory;
		}
		else {
			definition.instance = factory;
			var peer = peers[namespace] = createPeer(definition);
			var api = peer.api = {};
			for(var message in peer) {
				var chain = peer[message];
				if(typeof chain === "function") {
					var topic = namespace + "/" + message;
					Hub.subscribe(topic, chain);
					api[message] = Hub.publisher(topic);
				}
			}
		}
		definitions[namespace] = definition;
	};
	
	Hub.get = function(namespace) {
		return getPeer(namespace).api;
	};
	
	Hub.resetPeers = function() {
		peers = {};
		for(var k in definitions) {
			if(k.indexOf("lib.") === -1) {
				delete definitions[k];
			}
		}
	};
	
}());
