/*
 * Copyright (c) 2011 Maximilian Antoni
 */
/**
 * The Hub is a message multi-caster, object factory with mixin support
 */
Hub = function() {
	
	/*
	 * internal fields:
	 * 
	 * nodes: all node instances that have been created
	 * aspects: all aspect instances that have been created
	 * definitions: all node or aspect definitions
	 * nextCallback: the next callback to execute in the current chain or false
	 * nextScope: the scope to use for nextCallback
	 * nextData: the data to pass to nextCallback
	 * emptyArray: an empty array used as an internal value object
	 */
	var nodes = {}, aspects = {}, definitions = {}, nextCallback = false,
		nextScope, nextData, emptyArray = [];
	
	/*
	 * creates a call chain for the two given functions.
	 */
	var chain = function(first, second) {
		return function(data) {
			var previous = nextCallback;
			nextCallback = second;
			nextScope = this;
			nextData = data;
			try {
				first.call(this, data);
				if(nextCallback) {
					second.call(this, data);
				}
			}
			finally {
				nextCallback = previous;
				nextScope = undefined;
				nextData = undefined;
			}
		};
	};
	
	/*
	 * adds a callback to the given node under the specified message.
	 */
	var apply = function(node, message, callback) {
		node[message] = message in node ? chain(callback, node[message]) : callback;
	};
	
	/*
	 * applies a mix-in to a node.
	 */
	var mix = function(node, mixin) {
		for(var message in mixin) {
			apply(node, message, mixin[message]);
		}
	};
	
	/*
	 * converts the given argument to an array if necessary.
	 */
	var argArray = function(arg) {
		return arg ? (typeof arg === "string" ? [arg] : arg) : emptyArray;
	};
	
	/*
	 * stores a node in the given namespace. If there is a node
	 * associated with the namespace, the nodes get mixed.
	 */
	var storeNode = function(namespace, node) {
		if(namespace in nodes) {
			mix(nodes[namespace], node);
		}
		else {
			nodes[namespace] = node;
		}
	};
	
	/*
	 * creates a node for the node definition with the given name.
	 */
	var createNode = function(namespace) {
		var node = {}, definition = definitions[namespace], store = true;
		if(definition) {
			var is = argArray(definition.is);
			for(var i = 0, mixin; mixin = is[i++];) {
				mix(node, getNode(mixin));
			}
			mix(node, definition.factory());
			if(definition.scope === Hub.PROTOTYPE) {
				store = false;
			}
		}
		if(store) {
			storeNode(namespace, node);
		}
		return node;
	};
	
	var matcher = function(name) {
		var exp = name.replace(/\./g, '\\.').replace(/\*\*/g, '[a-zA-Z0-9\\.]+').replace(/\*/g, '[a-zA-Z0-9]+');
		return new RegExp('^' + exp + '$');
	};
	
	/*
	 * returns a node instance for the definition with the given namespace.
	 */
	var getNode = function(namespace) {
		return nodes[namespace] || createNode(namespace);
	};
	
	/*
	 * finds all matching nodes for a namespace that contains wildcards.
	 */
	var findNodes = function(namespace) {
		var match = [];
		var re = matcher(namespace);
		for(namespace in definitions) {
			if(re.test(namespace)) {
				match.push(getNode(namespace));
			}
		}
		return match;
	};
		
	var publish = function(node, message, data) {
		if(node[message]) {
			node[message](data);
		}
		else if(message.indexOf("*") !== -1) {
			var re = matcher(message);
			for(message in node) {
				if(re.test(message)) {
					node[message](data);
				}
			}
		}
	};
	
	
	// Public API:
	return {
		
		/**
		 * the SINGLETON scope.
		 * 
		 * @type String
		 */
		SINGLETON: "SINGLETON",
		
		/**
		 * the PROTOTYPE scope.
		 * 
		 * @type String
		 */
		PROTOTYPE: "PROTOTYPE",
		
		/**
		 * resets the Hub to it's initial state. Primarily required for unit testing.
		 */
		reset: function() {
			nodes = {};
			definitions = {};
		},
		
		subscribe: function(namespace, message, callback) {
			apply(getNode(namespace), message, callback);
		},
		
		/**
		 * <p>
		 * defines a node in the Hub that publishes and receives messages.
		 * </p>
		 * <p>
		 * Configuration parameters:
		 * </p>
		 * <ul>
		 * <li>is (String|Array): single node name or list of node names
		 * this node inherits from</li>
		 * <li>requires (String|Array): single function name or list of
		 * function names this node requires to be defined</li>
		 * <li>scope (String): the scope, either Hub.SINGLETON or
		 * Hub.PROTOTYPE</li>
		 * <li>lazy (Boolean): whether to instantiate the singleton lazy</li>
		 * </ul>
		 * 
		 * @param {String} namespace the namespace of the node
		 * @param {Object} config the node configuration
		 * @param {Function} factory the factory for the map of listeners
		 */
		node: function(namespace, config, factory) {
			if(definitions[namespace]) {
				throw new Error("Hub - node already defined: " + namespace);
			}
			if(typeof config === "function") {
				factory = config;
				config = {};
			}
			config.factory = factory;
			definitions[namespace] = config;
			if(nodes[namespace]) {
				/*
				 * If the node already exists, we have to eagerly create
				 * the node and merge it with the existing.
				 */
				createNode(namespace);
			}
		},
		
		/**
		 * <p>
		 * publishes a message on the given namespace.
		 * </p>
		 * <p>
		 * If forceSync is set to true but any listener can only process the
		 * request asynchronously, an error is thrown.
		 * </p>
		 * 
		 * @param {String} namespace the namespace
		 * @param {String} message the message
		 * @param {Object} data the data to pass
		 */
		publish: function(namespace, message, data) {
			if(namespace.indexOf("*") === -1) {
				publish(getNode(namespace), message, data);
			}
			else {
				var nodes = findNodes(namespace);
				for(var i = 0, node; node = nodes[i++];) {
					publish(node, message, data);
				}
			}
		},
		
		/**
		 * stops message propagation for the current publish call.
		 */
		stopPropagation: function() {
			nextCallback = false;
		},
		
		/**
		 * explicitly propagates the message to the next listener for the
		 * current publish call.
		 */
		propagate: function() {
			nextCallback.call(nextScope, nextData);
			nextCallback = false;
		},
		
		/**
		 * <p>
		 * defines a proxy node with the given name that loads a script lazily
		 * expecting the node to be properly defined in the script. Once the
		 * script is loaded the original request made to the proxy is forwarded
		 * to the actual node.
		 * </p>
		 * <p>
		 * If the script does define the expected node an error is thrown. 
		 * </p>
		 * 
		 * @param namespace the namespace
		 * @param scriptUrl the script URL
		 */
		proxy: function(namespace, scriptUrl) {
			
		}
	
	};
	
}();