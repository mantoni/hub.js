/*
 * Copyright (c) 2011 Maximilian Antoni
 */
/**
 * The Hub is a message multi-caster, object factory with mixin support
 */
Hub = function() {
	
	var nodes = {}, definitions = {}, next = false, nextScope, nextData, emptyArray = [];
	
	/*
	 * creates a call chain for the two given functions.
	 */
	var chain = function(first, second) {
		return function(data) {
			var previous = next;
			next = second;
			nextScope = this;
			nextData = data;
			try {
				first.call(this, data);
				if(next) {
					second.call(this, data);
				}
			}
			finally {
				next = previous;
				nextScope = undefined;
				nextData = undefined;
			}
		};
	};
	
	/*
	 * applies a mix-in to an object.
	 */
	var mix = function(object, mixin) {
		for(var key in mixin) {
			var value = mixin[key];
			object[key] = key in object ? chain(value, object[key]) : value;
		}
	};
	
	/*
	 * ensures the given argument is an array.
	 */
	var argArray = function(arg) {
		return arg ? (typeof arg === "string" ? [arg] : arg) : emptyArray;
	};
	
	/*
	 * creates a node for the node definition with the given name.
	 */
	var createNode = function(name) {
		var definition = definitions[name];
		if(!definition) {
			return;
		}
		var node = {};
		var is = argArray(definition.is);
		for(var i = 0, mixin; mixin = is[i++];) {
			mix(node, getNode(mixin));
		}
		mix(node, definition.factory());
		if(!definition.scope || definition.scope === Hub.SINGLETON) {
			nodes[name] = node;
		}
		return node;
	};
	
	var matcher = function(name) {
		var exp = name.replace(/\./g, '\\.').replace(/\*\*/g, '[a-zA-Z0-9\\.]+').replace(/\*/g, '[a-zA-Z0-9]+');
		return new RegExp('^' + exp + '$');
	};
	
	/*
	 * returns a node instance for the definition with the given name.
	 */
	var getNode = function(name) {
		return nodes[name] || createNode(name);
	};
	
	var matchNodes = function(name) {
		var match = [];
		var re = matcher(name);
		for(var k in nodes) {
			if(re.test(k)) {
				// Wildcards only match singletons.
				match.push(nodes[k]);
			}
		}
		return match;
	};
		
	var publish = function(node, key, data) {
		if(node[key]) {
			node[key](data);
		}
		if(key.indexOf("*") !== -1) {
			var re = matcher(key);
			for(var k in node) {
				if(re.test(k)) {
					node[k](data);
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
		 * @param {String} name the name of the node used as the topic prefix
		 * @param {Object} config the node configuration
		 * @param {Function} factory the factory for the map of listeners
		 */
		node: function(name, config, factory) {
			if(definitions[name]) {
				throw new Error("Hub - node already defined: " + name);
			}
			if(typeof config === "function") {
				factory = config;
				config = {};
			}
			config.factory = factory;
			definitions[name] = config;
		},
		
		/**
		 * <p>
		 * publishes data on the given topic.
		 * </p>
		 * <p>
		 * If forceSync is set to true but any listener can only process the
		 * request asynchronously, an error is thrown.
		 * </p>
		 * 
		 * @param {String} topic the topic
		 * @param {Object} data the data to send
		 */
		publish: function(topic, data) {
			var p = topic.lastIndexOf(".");
			while(p !== -1) {
				var name = topic.substring(0, p);
				var key = topic.substring(p + 1);
				if(name.indexOf("*") === -1) {
					var node = getNode(name);
					if(node) {
						publish(node, key, data);
					}
				}
				else if(key || name.lastIndexOf("**") === name.length - 2) {
					if(!key) {
						key = "**";
					}
					var nodes = matchNodes(name);
					for(var i = 0, node; node = nodes[i++];) {
						publish(node, key, data);
					}
				}
				p = topic.lastIndexOf(".", p - 1);
			}
		},
		
		/**
		 * stops message propagation for the current publish call.
		 */
		stopPropagation: function() {
			next = false;
		},
		
		/**
		 * explicitly propagates the message for the current publish call.
		 */
		propagate: function() {
			next.call(nextScope, nextData);
			next = false;
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
		 */
		proxy: function(name, scriptUrl) {
			
		}
	
	};
	
}();