/**
 * @license hub.js JavaScript library
 * https://github.com/mantoni/hub.js
 * 
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * The Hub singleton exposes the Hub API.
 */
Hub = function() {
	
	/*
	 * internal fields:
	 * 
	 * peers: all peer instances that have been created
	 * aspects: all aspect instances that have been created
	 * definitions: all peer or aspect definitions
	 * nextFn: the next function to execute in the current chain or false
	 * nextData: the data to pass to nextFn
	 * emptyArray: an empty array used as an internal value object
	 */
	var peers = {}, aspects = {}, definitions = {}, nextFn = false,
		nextData, promise = true, emptyArray = [];
	
	/*
	 * creates a call chain for the two given functions.
	 */
	function chain() {
		function fn(data) {
			var previous = nextFn;
			nextFn = fn.second;
			nextData = data;
			try {
				fn.first(data);
				if(nextFn) {
					fn.second(data);
				}
			}
			finally {
				nextFn = previous;
				nextData = undefined;
			}
		};
		fn.first = arguments[0];
		fn.second = arguments[1];
		return fn;
	}
	
	function unsubscribe(f, fn) {
		if(f === fn) {
			return;
		}
		if(f.first === fn) {
			return f.second;
		}
		if(!(f.second = unsubscribe(f.second, fn))) {
			return f.first;
		}
		return f;
	}
	
	/*
	 * adds a function to the given peer under the specified message.
	 */
	function apply(peer, message, fn) {
		peer[message] = message in peer ? chain(fn, peer[message]) : fn;
	}
	
	/*
	 * applies a mix-in to a peer.
	 */
	function mix(peer, mixin) {
		for(var message in mixin) {
			apply(peer, message, mixin[message]);
		}
	}
	
	/*
	 * converts the given argument to an array if necessary.
	 */
	function argArray(arg) {
		return arg ? (typeof arg === "string" ? [arg] : arg) : emptyArray;
	}
	
	/*
	 * stores a peer in the given namespace. If there is a peer
	 * associated with the namespace, the peers get mixed.
	 */
	function storePeer(namespace, peer) {
		if(namespace in peers) {
			mix(peers[namespace], peer);
		}
		else {
			peers[namespace] = peer;
		}
	}
	
	/*
	 * creates a peer for the peer definition with the given name.
	 */
	function createPeer(namespace) {
		var peer = {}, definition = definitions[namespace], store = true;
		if(definition) {
			var is = argArray(definition.is);
			for(var i = 0, mixin; mixin = is[i++];) {
				mix(peer, getPeer(mixin));
			}
			mix(peer, definition.factory());
			if(definition.scope === Hub.PROTOTYPE) {
				store = false;
			}
		}
		if(store) {
			storePeer(namespace, peer);
		}
		return peer;
	}
	
	function pathMatcher(name) {
		var exp = name.replace(/\./g, '\\.').replace(
				/\*\*/g, '[a-zA-Z0-9\\.]+').replace(/\*/g, '[a-zA-Z0-9]+');
		return new RegExp('^' + exp + '$');
	}
	
	/*
	 * returns a peer instance for the definition with the given namespace.
	 */
	function getPeer(namespace) {
		return peers[namespace] || createPeer(namespace);
	}
	
	/*
	 * finds all matching peers for a namespace that contains wildcards.
	 */
	function findPeers(namespace) {
		var match = [];
		var re = pathMatcher(namespace);
		for(namespace in definitions) {
			if(re.test(namespace)) {
				match.push(getPeer(namespace));
			}
		}
		return match;
	}
	
	function publishCallbackError(namespace, message, error) {
		Hub.publish("hub.error.error", "publish", {
			message: "Error in callback for {namespace}/{message}: {error}",
			context: {
				namespace: namespace,
				message: message,
				error: error
			}
		});
	}
	
	function publishMessageOnPeer(namespace, peer, message, data) {
		if(peer[message]) {
			try {
				return peer[message](data);
			}
			catch(e) {
				publishCallbackError(namespace, message, e.message);
				return;
			}
		}
		if(message.indexOf("*") !== -1) {
			var re = pathMatcher(message), result;
			for(message in peer) {
				if(re.test(message)) {
					try {
						result = Hub.util.merge(result, peer[message](data));
					}
					catch(e) {
						publishCallbackError(namespace, message, e.message);
					}
				}
			}
			return result;
		}
	}
	
	function processChainItem(item, data, success) {
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
	}
	
	function createPromise(fulfilled) {
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
					data = Hub.util.merge(value, data);
					return Hub.publish(namespace, message, data);
				}
				return this.then(function() {
					data = Hub.util.merge(value, data);
					return Hub.publish(namespace, message, data);
				});
			},
			fulfill: function(data) {
				this.mergeValue(data);
				fulfilled = true;
				while(chain.length) {
					success = processChainItem(chain.shift(), value, success);
				}
				return this;
			},
			fulfilled: function() {
				return fulfilled;
			},
			mergeValue: function(data) {
				if(fulfilled) {
					throw new Error("Hub - promise already fulfilled");
				}
				value = Hub.util.merge(value, data);
			}
		};
	}
	
	// Helper function to replace the given proxy with a new promise.
	function replacePromiseProxy(proxy) {
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
		}
	};
	
	// Return public API:
	return {
		
		/**
		 * the SINGLETON scope.
		 * 
		 * @type {string}
		 * @const
		 */
		SINGLETON: "SINGLETON",
		
		/**
		 * the PROTOTYPE scope.
		 * 
		 * @type {string}
		 * @const
		 */
		PROTOTYPE: "PROTOTYPE",
		
		/**
		 * resets the Hub to it's initial state. Primarily required for unit
		 * testing.
		 */
		reset: function() {
			peers = {};
			for(var k in definitions) {
				if(k.indexOf("lib.") === -1) {
					delete definitions[k];
				}
			}
		},
		
		/**
		 * subscribes a callback function to the given namespace and message.
		 * 
		 * @param {string} namespace The namespace.
		 * @param {string} message The message.
		 * @param {function(object)} fn The callback function.
		 */
		subscribe: function(namespace, message, fn) {
			apply(getPeer(namespace), message, fn);
		},
		
		/**
		 * subscribes a callback function to the given namespace and message.
		 * 
		 * @param {string} namespace The namespace.
		 * @param {string} message The message.
		 * @param {function(object)} fn The callback function.
		 */
		unsubscribe: function(namespace, message, fn) {
			var peer = peers[namespace];
			if(!peer) {
				return;
			}
			if(peer[message] && !(peer[message] = unsubscribe(peer[message], fn))) {
				delete peer[message];
			}
		},
		
		/**
		 * <p>
		 * defines a peer in the Hub that publishes and receives messages.
		 * </p>
		 * <p>
		 * Configuration parameters:
		 * </p>
		 * <ul>
		 * <li>is (String|Array): single peer name or list of peer names this
		 * peer inherits from</li>
		 * <li>requires (String|Array): single function name or list of function
		 * names this peer requires to be defined</li>
		 * <li>scope (String): the peer scope, either Hub.SINGLETON or
		 * Hub.PROTOTYPE</li>
		 * <li>lazy (Boolean): whether to instantiate the singleton lazy</li>
		 * </ul>
		 * 
		 * @param {String} namespace the namespace of the peer
		 * @param {Object} config the peer configuration
		 * @param {Function} factory the factory for the map of listeners
		 */
		peer: function(namespace, config, factory) {
			if(definitions[namespace]) {
				throw new Error("Hub - peer already defined: " + namespace);
			}
			if(typeof config === "function") {
				factory = config;
				config = {};
			}
			config.factory = factory;
			definitions[namespace] = config;
			if(peers[namespace]) {
				/*
				 * If the peer already exists, we have to eagerly create
				 * the peer and merge it with the existing.
				 */
				createPeer(namespace);
			}
		},
		
		/**
		 * publishes a message on the given namespace.
		 * 
		 * @param {String} namespace the namespace
		 * @param {String} message the message
		 * @param {Object} data the data to pass
		 */
		publish: function(namespace, message, data) {
			var previousPromise = promise, result;
			promise = false;
			if(namespace.indexOf("*") === -1) {
				var peer = getPeer(namespace);
				result = publishMessageOnPeer(namespace, peer, message, data);
			}
			else {
				var matches = findPeers(namespace);
				for(var i = 0, peer; peer = matches[i++];) {
					var value = publishMessageOnPeer(namespace, peer, message, data);
					result = Hub.util.merge(result, value);
				}
			}
			var returnPromise = promise;
			promise = previousPromise;
			if(result !== undefined) {
				if(returnPromise) {
					returnPromise.mergeValue(result);
				}
				else {
					returnPromise = createPromise(false);
					returnPromise.fulfill(result);
				}
			}
			return returnPromise || new PromiseProxy();
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
			nextFn(nextData);
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
		 * defines a peer with the given name that loads a script lazily
		 * expecting the peer to be properly defined in the script. Once the
		 * script is loaded the original request made to the proxy is forwarded
		 * to the actual peer.
		 * </p>
		 * <p>
		 * If the script does define the expected peer an error is thrown. 
		 * </p>
		 * 
		 * @param namespace the namespace
		 * @param scriptUrl the script URL
		 */
		lazy: function(namespace, scriptUrl) {
			throw new Error("Not yet supported");
		},
		
		/**
		 * <p>
		 * defines an alias for a namespace / message pair. This allows to
		 * define a general purpose listener or peer and reuse it on different
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
		},
		
		util: {
			
			/**
			 * merges the source object into the target object.
			 */
			merge: function(target, source) {
				if(target === undefined || target === null || target === source) {
					return source;
				}
				if(source === undefined || source === null) {
					return target;
				}
				var sourceType = Object.prototype.toString.call(source);
				var targetType = Object.prototype.toString.call(target);
				if(targetType === sourceType) {
					if(sourceType === "[object Object]") {
						for(var k in source) {
							target[k] = arguments.callee(target[k], source[k]);
						}
						return target;
					}
					if(sourceType === "[object Array]") {
						return target.concat(source);
					}
				}
				Hub.publish("hub.error.warn", "util.merge", {
					message: targetType === sourceType ?
							"Cannot merge value {target} with {source}" :
							"Cannot merge type {targetType} with {sourceType}",
					context: {
						target: target,
						source: source,
						targetType: targetType,
						sourceType: sourceType
					}
				});
				return target;
			}
			
		}
	
	};
	
}();