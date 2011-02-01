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
	 * nextFn: the next function to execute in the current chain or false
	 * nextScope: the scope to use for nextFn
	 * nextData: the data to pass to nextFn
	 * emptyArray: an empty array used as an internal value object
	 */
	var nodes = {}, aspects = {}, definitions = {}, nextFn = false,
		nextScope, nextData, promise = true, emptyArray = [];
	
	/*
	 * creates a call chain for the two given functions.
	 */
	var chain = function(first, second) {
		return function(data) {
			var previous = nextFn;
			nextFn = second;
			nextScope = this;
			nextData = data;
			try {
				first.call(this, data);
				if(nextFn) {
					second.call(this, data);
				}
			}
			finally {
				nextFn = previous;
				nextScope = undefined;
				nextData = undefined;
			}
		};
	};
	
	/*
	 * adds a function to the given node under the specified message.
	 */
	var apply = function(node, message, fn) {
		node[message] = message in node ? chain(fn, node[message]) : fn;
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
	
	var pathMatcher = function(name) {
		var exp = name.replace(/\./g, '\\.').replace(
				/\*\*/g, '[a-zA-Z0-9\\.]+').replace(/\*/g, '[a-zA-Z0-9]+');
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
		var re = pathMatcher(namespace);
		for(namespace in definitions) {
			if(re.test(namespace)) {
				match.push(getNode(namespace));
			}
		}
		return match;
	};
	
	var publishMessageOnNode = function(node, message, data) {
		if(node[message]) {
			node[message](data);
		}
		else if(message.indexOf("*") !== -1) {
			var re = pathMatcher(message);
			for(message in node) {
				if(re.test(message)) {
					node[message](data);
				}
			}
		}
	};
	
	var processChainItem = function(item, data, success) {
		if(success) {
			if(!item.success) {
				return true;
			}
			try {
				item.success(data);
				return true;
			}
			catch(e1) {
				console.warn("Hub - error in promise success handler: "
						+ e1.message);
				return false;
			}
		}
		if(item.error) {
			try {
				item.error(data);
			}
			catch(e2) {
				console.warn("Hub - error in promise error handler: "
						+ e2.message);
			}
		}
		return false;
	};
	
	var createPromise = function(fulfilled) {
		var chain = [], value, success = true;
		return {
			then: function(success, error) {
				var item = {
					success: success,
					error: error
				};
				if(fulfilled) {
					success = processChainItem(item, value, success);
				}
				else {
					chain.push(item);
				}
				return this;
			},
			publish: function(namespace, message, data) {
				if(fulfilled) {
					return Hub.publish(namespace, message, data);
				}
				return this.then(function() {
					return Hub.publish(namespace, message, data);
				});
			},
			fulfill: function(data) {
				if(fulfilled) {
					throw new Error("Hub - promise already fulfilled");
				}
				fulfilled = true;
				value = data;
				while(chain.length) {
					success = processChainItem(chain.shift(), value, success);
				}
				return this;
			},
			fulfilled: function() {
				return fulfilled;
			}
		};
	};
	
	// Helper function to replace the given proxy with a new promise.
	var replacePromiseProxy = function(proxy) {
		var real = createPromise(true);
		proxy.then = real.then;
		proxy.publish = real.publish;
		return real;
	}
	/*
	 * PromiseProxy is a lightweight object that creates the actual
	 * promise on demand.
	 */
	var PromiseProxy = function() {};
	PromiseProxy.prototype = {
		then: function(success, error) {
			return replacePromiseProxy(this).then(success, error);
		},
		publish: function(namespace, message, data) {
			return replacePromiseProxy(this).publish(namespace, message, data);
		},
		fulfill: function(data) {
			throw new Error("Hub - promise already fulfilled");
		},
		fulfilled: function() {
			return true;
		},
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
		 * resets the Hub to it's initial state. Primarily required for unit
		 * testing.
		 */
		reset: function() {
			nodes = {};
			definitions = {};
		},
		
		subscribe: function(namespace, message, fn) {
			apply(getNode(namespace), message, fn);
		},
		
		/**
		 * <p>
		 * defines a node in the Hub that publishes and receives messages.
		 * </p>
		 * <p>
		 * Configuration parameters:
		 * </p>
		 * <ul>
		 * <li>is (String|Array): single node name or list of node names this
		 * node inherits from</li>
		 * <li>requires (String|Array): single function name or list of function
		 * names this node requires to be defined</li>
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
			var previousPromise = promise;
			promise = false;
			try {
				if(namespace.indexOf("*") === -1) {
					publishMessageOnNode(getNode(namespace), message, data);
				}
				else {
					var nodes = findNodes(namespace);
					for(var i = 0, node; node = nodes[i++];) {
						publishMessageOnNode(node, message, data);
					}
				}
			}
			finally {
				var result = promise;
				promise = previousPromise;
				return result || new PromiseProxy();
			}
		},
		
		/**
		 * stops message propagation for the current publish call.
		 */
		stopPropagation: function() {
			nextFn = false;
		},
		
		/**
		 * explicitly propagates the message to the next listener for the
		 * current publish call.
		 */
		propagate: function() {
			nextFn.call(nextScope, nextData);
			nextFn = false;
		},
		
		/**
		 * returns a promise.
		 */
		promise: function() {
			if(promise === true) {
				return createPromise(false);
			}
			if(promise === false) {
				promise = createPromise(false);
			}
			return promise;
		},
		
		/**
		 * <p>
		 * defines a node with the given name that loads a script lazily
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
		lazy: function(namespace, scriptUrl) {
			
		},
		
		/**
		 * <p>
		 * defines an alias for a namespace / message pair. This allows to
		 * define a general purpose listener or node and reuse it on different
		 * namespaces and messages.
		 * </p>
		 * <p>
		 * Publishing on a namespace / message pair that matches the alias will
		 * trigger the subscribers on the "real" namespace / message pair.
		 * </p>
		 * 
		 * @param aliasNamespace the alias for the namespace
		 * @param aliasMessage the alias for the message
		 * @param namespace the namespace to forward to
		 * @param message the message to forward to
		 */
		alias: function(aliasNamespace, aliasMessage, namespace, message) {
			Hub.subscribe(aliasNamespace, aliasMessage, function(data) {
				return Hub.publish(namespace, message, data);
			});
		}
	
	};
	
}();