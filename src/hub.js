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
	
	/**
	 * All peer instances that have been created.
	 *
	 * @type {object}
	 */
	var peers = {};
	
	/**
	 * All peer or aspect definitions.
	 *
	 * @type {object}
	 */
	var definitions = {};
	
	/**
	 * The next function to execute in the current chain or false.
	 *
	 * @type {Function}
	 */
	var nextFn = false;
	
	/**
	 * The data to pass to nextFn.
	 *
	 * @type {*}
	 */
	var nextData;
	
	/**
	 * An empty array used as an internal value object.
	 *
	 * @type {Array}
	 */
	var emptyArray = [];
	
	/**
	 * The current promise. Also indicates whether currently executing
	 * Hub.publish.
	 *
	 * @type {object}
	 */
	var promise = true;
	
	/**
	 * All promises currently monitored for timeouts.
	 *
	 * @type {object}
	 */
	var monitored = {};
	
	/**
	 * @type {number}
	 */	
	var monitorTimeout = undefined;
	/**
	 * @type {number}
	 */	
	var onceTimeout = undefined;
	/**
	 * @type {number}
	 */	
	var promiseCounter = 0;
	/**
	 * @type {number}
	 */	
	var now = undefined;
	
	/**
	 * creates a call chain for the given functions.
	 */
	function chain(first, second) {
		var newChain = function(data) {
			if(!first) {
				second(data);
			}
			else if(!second) {
				first(data);
			}
			else {
				var previousFn = nextFn;
				nextFn = second;
				nextData = data;
				try {
					first(data);
					if(nextFn) {
						second(data);
					}
				}
				finally {
					nextFn = previousFn;
					nextData = undefined;
				}
			}
		};
		newChain.remove = function(fn) {
			if(fn === first) {
				first = undefined;
				return second;
			}
			if(fn === second || (typeof second.remove === "function" &&
					!(second = second.remove(fn)))) {
				second = undefined;
				return first;
			}
			return newChain;
		}
		return newChain;
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
		var exp = name.replace(/\./g, "\\.").replace(
				/\*\*/g, "[a-zA-Z0-9\\.]+").replace(/\*/g, "[a-zA-Z0-9]+");
		return new RegExp("^" + exp + "$");
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
		Hub.publish("hub.error", "publish", {
			type: "error",
			description: "Error in callback for {namespace}/{message}: {error}",
			context: {
				namespace: namespace,
				message: message,
				error: error
			}
		});
	}
	
	// helper function for publishMessageOnPeer
	function handleMessageResult(result) {
		if(result === undefined) {
			return;
		}
		var p = createPromise(true, result);
		promise = promise ? joinPromises(promise, p) : p;
	}
	
	// helper function for Hub.publish
	function publishMessageOnPeer(namespace, peer, message, data) {
		if(peer[message]) {
			try {
				handleMessageResult(peer[message](data));
			}
			catch(e) {
				publishCallbackError(namespace, message, e.message);
				return;
			}
		}
		if(message.indexOf("*") !== -1) {
			var re = pathMatcher(message);
			for(message in peer) {
				if(re.test(message)) {
					try {
						handleMessageResult(peer[message](data));
					}
					catch(e) {
						publishCallbackError(namespace, message, e.message);
					}
				}
			}
		}
	}
	
	// internal observer for monitored promises.
	function checkMonitored() {
		onceTimeout = undefined;
		now = new Date().getTime();
		var next = -1;
		for(var id in monitored) {
			var spec = monitored[id];
			var expires = spec[0];
			if(expires <= now) {
				spec[1].reject({
					type: "timeout"
				});
				delete monitored[id];
			}
			else {
				next = next === -1 ? expires : Math.min(expires, next);
			}
		}
		if(next !== -1) {
			monitorTimeout = setTimeout(checkMonitored, next);
		}
		now = undefined;
	}
	
	/*
	 * monitors the given promise which causes the promise to time out after
	 * the specified timeout.
	 *
	 * @param {Object} p the promise to monitor.
	 * @param {Number} timeout the timeout in milliseconds.
	 * @return {Number} the monitor identifier.
	 */
	function monitor(p, timeout) {
		if(!now) {
			now = new Date().getTime();
		}
		var id = ++promiseCounter;
		monitored[id] = [now + timeout, p];
		if(!onceTimeout) {
			clearTimeout(monitorTimeout);
			onceTimeout = setTimeout(checkMonitored, 15);
		}
		return id;
	}
	
	/*
	 * removes the promise monitor for the given monitor identifier. The
	 * identifier is returned from monitor(promise, timeout).
	 *
	 * @param {Number} the monitor identifier.
	 */
	function unmonitor(id) {
		delete monitored[id];
	}
	
	/*
	 * <p>
	 * invoke the given callback and pass in the data. If an error occurs
	 * during execution, an error message is published on the hub.
	 * </p>
	 * <p>
	 * Used by promises to invoke the success or error callbacks.
	 * </p>
	 *
	 * @param {Function} callback the callback function.
	 * @param {*} data the data to pass to the callback.
	 */
	function invokePromiseCallback(callback, data) {
		if(callback) {
			try {
				callback(data);
			}
			catch(e) {
				Hub.publish("hub.error", "promise.callback", {
					type: "error",
					description: "Error in promise callback: ${error}",
					context: {
						error: e.message
					}
				});
			}
		}
	}
	
	/*
	 * called by a promises fulfill() and reject() methods if the promise was
	 * already fulfilled. Publishes an error message on the hub.
	 */
	function promiseAlreadyFulfilled() {
		Hub.publish("hub.error", "promise.fulfilled", {
			type: "validation",
			description: "Promise already fulfilled",
			context: {}
		});
	}
	
	/*
	 * creates a new promise.
	 *
	 * @param {Boolean} fulfilled whether the promise is initially fulfilled.
	 * @param {*} value the initial value.
	 * @param {Number} timeout the optional timeout.
	 * @return {Object} the new promise.
	 */
	function createPromise(fulfilled, value, timeout) {
		var callbacks = [];
		var errorCallbacks = [];
		var success = true;
		var timeoutId;
		var p;
		// Public API:
		p = {
			/**
			 * @param {Function} callback the success callback.
			 * @param {Function} errorCallback the error callback.
			 * @return {Object} this promise.
			 */
			then: function(callback, errorCallback) {
				if(fulfilled) {
					invokePromiseCallback(success ? callback : errorCallback, value);
				}
				else {
					if(callback) {
						callbacks.push(callback);
					}
					if(errorCallback) {
						errorCallbacks.push(errorCallback);
					}
				}
				return this;
			},
			/**
			 * @param {String} namespace the namespace.
			 * @param {String} message the message.
			 * @param {*} data the data.
			 * @return {Object} this promise.
			 */
			publish: function(namespace, message, data) {
				if(fulfilled) {
					data = Hub.util.merge(value, data);
					return Hub.publish(namespace, message, data);
				}
				return this.then(function() {
					data = Hub.util.merge(value, data);
					Hub.publish(namespace, message, data);
					// A return value would be meaningless here.
				});
			},
			/**
			 * @param {*} data the data.
			 * @return {Object} this promise.
			 */
			fulfill: function(data) {
				if(fulfilled) {
					promiseAlreadyFulfilled();
				}
				else {
					fulfilled = true;
					unmonitor(timeoutId);
					value = Hub.util.merge(value, data);
					while(callbacks.length) {
						invokePromiseCallback(callbacks.shift(), value);
					}
				}
				return this;
			},
			/**
			 * @param {*} error the error data.
			 * @return {Object} this promise.
			 */
			reject: function(error) {
				if(fulfilled) {
					promiseAlreadyFulfilled();
				}
				else {
					fulfilled = true;
					success = false;
					unmonitor(timeoutId);
					while(callbacks.length) {
						invokePromiseCallback(errorCallbacks.shift(), error);
					}
				}
				return this;
			},
			/**
			 * @return {Boolean} whether this promise was fulfilled.
			 */
			fulfilled: function() {
				return fulfilled;
			}
		};
		if(!fulfilled) {
			timeoutId = monitor(p, timeout || 60000);
		}
		return p;
	}
	
	/**
	 * joins the given promises together in a new promise. This means the
	 * returned promise is fulfilled if the given promises are fulfilled. If
	 * both promises succeed then the returned promise succeeds as well with
	 * the data ob the promises being merged. If one of the given promises
	 * failes, then the returned promise fails as well with the data set to
	 * the data of the failing promise, or the merged data if both promises
	 * failed.
	 *
	 * @param {Object} p1 the first promise
	 * @param {Object} p2 the second promise
	 * @return {Object} the joined promise
	 */
	function joinPromises(p1, p2) {
		var mergedData;
		var count = 0;
		var wrapper = createPromise(false, undefined);
		var success = true;
		/*
		 * checks whether the promise is done and calls fulfill or reject on
		 * the wrapper.
		 */
		function checkDone() {
			if(++count === 2) {
				(success ? wrapper.fulfill : wrapper.reject)(mergedData);
			}
		}
		function onSuccess(data) {
			if(success) {
				mergedData = Hub.util.merge(mergedData, data);
			}
			checkDone();
		}
		function onError(data) {
			if(success) {
				success = false;
				mergedData = data;
			}
			else {
				mergedData = Hub.util.merge(mergedData, data);
			}
			checkDone();
		}
		p1.then(onSuccess, onError);
		p2.then(onSuccess, onError);
		return wrapper;
	}
	
	// Helper function to replace the given proxy with a new promise.
	function replacePromiseProxy(proxy) {
		var real = createPromise(true);
		proxy.then = real.then;
		proxy.publish = real.publish;
		return real;
	}
	
	/*
	 * PromiseProxy is a lightweight object that creates the actual promise
	 * on demand.
	 */
	var PromiseProxy = function() {};
	// Same API as actual promise:
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
			if(onceTimeout) {
				clearTimeout(onceTimeout);
				onceTimeout = undefined;
			}
			if(monitorTimeout) {
				clearTimeout(monitorTimeout);
				monitorTimeout = undefined;
			}
			now = undefined;
			monitored = {};
		},
		
		/**
		 * <p>
		 * subscribes a callback function to the given namespace and message.
		 * </p>
		 * <p>
		 * The namespace and message pair can be also joined in one string:
		 * "{namespace}/{message}".
		 * </p>
		 * 
		 * @param {string} namespace The namespace.
		 * @param {string} message The message.
		 * @param {function(object)} fn The callback function.
		 */
		subscribe: function(namespace, message, fn) {
			var p = namespace.indexOf("/");
			if(p !== -1) {
				fn = message;
				message = namespace.substring(p + 1);
				namespace = namespace.substring(0, p);
			}
			apply(getPeer(namespace), message, fn);
		},
		
		/**
		 * <p>
		 * subscribes a callback function to the given namespace and message.
		 * </p>
		 * <p>
		 * The namespace and message pair can be also joined in one string:
		 * "{namespace}/{message}".
		 * </p>
		 * 
		 * @param {string} namespace The namespace.
		 * @param {string} message The message.
		 * @param {function(object)} fn The callback function.
		 */
		unsubscribe: function(namespace, message, fn) {
			var p = namespace.indexOf("/");
			if(p !== -1) {
				fn = message;
				message = namespace.substring(p + 1);
				namespace = namespace.substring(0, p);
			}
			var peer = peers[namespace];
			if(!peer) {
				return;
			}
			var chain = peer[message];
			if(chain) {
				if(chain === fn) {
					delete peer[message];
				}
				else {
					peer[message] = chain.remove(fn);
				}
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
		 * <li>scope (String): the peer scope, either Hub.SINGLETON or
		 * Hub.PROTOTYPE. Defaults to Hub.SINGLETON.</li>
		 * </ul>
		 * 
		 * @param {String} namespace the namespace of the peer
		 * @param {Object} config the optional peer configuration
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
		 * <p>
		 * publishes a message on the given namespace.
		 * </p>
		 * <p>
		 * The namespace and message pair can be also joined in one string:
		 * "{namespace}/{message}".
		 * </p>
		 * 
		 * @param {String} namespace the namespace
		 * @param {String} message the message
		 * @param {Object} data the data to pass
		 */
		publish: function(namespace, message, data) {
			var p = namespace.indexOf("/");
			if(p !== -1) {
				data = message;
				message = namespace.substring(p + 1);
				namespace = namespace.substring(0, p);
			}
			var previousPromise = promise;
			promise = false;
			if(namespace.indexOf("*") === -1) {
				var peer = getPeer(namespace);
				publishMessageOnPeer(namespace, peer, message, data);
			}
			else {
				var matches = findPeers(namespace);
				for(var i = 0, peer; peer = matches[i++];) {
					publishMessageOnPeer(namespace, peer, message, data);
				}
			}
			var returnPromise = promise;
			promise = previousPromise;
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
		 *
		 * @param {Number} timeout the optional timeout for the promise
		 * @return {Object} the promise
		 */
		promise: function(timeout) {
			var newPromise = createPromise(false, undefined, timeout);
			if(promise === true) {
				// This means we are not within a publish call.
				return newPromise;
			}
			/*
			 * This means we are within a publish call now. If promise is false
			 * it means we do not have a promise yet. Otherwise there is an
			 * existing promise already which we can join with the new one.
			 */
			if(promise === false) {
				return promise = newPromise;
			}
			promise = joinPromises(promise, newPromise);
			return newPromise;
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
		 * @param {String} namespace the namespace
		 * @param {String} scriptUrl the script URL
		 */
		lazy: function(namespace, scriptUrl) {
			throw new Error("Not yet supported");
		},
		
		/**
		 * <p>
		 * defines a forward for a namespace / message pair. This allows to
		 * define a general purpose listener or peer and reuse it on different
		 * namespaces and messages. Publishing on a namespace / message pair
		 * that matches the forward will trigger the subscribers on the "real"
		 * namespace / message pair.
		 * </p>
		 * <p>
		 * Both namespace and message pairs can be also joined in one string:
		 * "{namespace}/{message}".
		 * </p>
		 * 
		 * @param {String} aliasNamespace the alias for the namespace
		 * @param {String} aliasMessage the alias for the message
		 * @param {String} namespace the namespace to forward to
		 * @param {String} message the message to forward to
		 * @param {Function} dataTransformer the optional function to transform
		 * 			the data on the callback
		 * @param {Object} dataToMerge the optional data to merge with the data
		 * 			on the callback
		 */
		forward: function(aliasNamespace, aliasMessage, namespace, message,
					dataTransformer, dataToMerge) {
			if(typeof aliasNamespace === "object") {
				for(var alias in aliasNamespace) {
					var value = aliasNamespace[alias];
					if(typeof value === "string") {
						Hub.forward(alias, value);
					}
					else {
						Hub.forward.apply(Hub, [alias].concat(value));
					}
				}
				return;
			}
			var p = aliasNamespace.indexOf("/");
			if(p !== -1) {
				dataToMerge = dataTransformer;
				dataTransformer = message;
				message = namespace;
				namespace = aliasMessage;
				aliasMessage = aliasNamespace.substring(p + 1);
				aliasNamespace = aliasNamespace.substring(0, p);
			}
			Hub.subscribe(aliasNamespace, aliasMessage, Hub.forwarder(
					namespace, message, dataToMerge, dataTransformer));
		},
		
		/**
		 * <p>
		 * creates a forwarder function for a namespace / message pair. The
		 * returned function forwards (publishes) on the given namespace and
		 * message.
		 * </p>
		 * <p>
		 * The namespace and message pair can be also joined in one string:
		 * "{namespace}/{message}".
		 * </p>
		 * 
		 * @param {String} namespace the namespace to forward to
		 * @param {String} message the message to forward to
		 * @param {Function} dataTransformer the optional function to transform
		 * 			the data on the callback
		 * @param {Object} dataToMerge the optional data to merge with the data
		 * 			on the callback
		 * @return {Function} the forwarder function
		 */
		forwarder: function(namespace, message, dataTransformer, dataToMerge) {
			var p = namespace.indexOf("/");
			if(p !== -1) {
				dataToMerge = dataTransformer;
				dataTransformer = message;
				message = namespace.substring(p + 1);
				namespace = namespace.substring(0, p);
			}
			if(dataTransformer) {
				if(dataToMerge) {
					return function(data) {
						return Hub.publish(namespace, message, Hub.util.merge(
								dataTransformer(data), dataToMerge));
					}
				}
				if(typeof dataTransformer === "function") {
					return function(data) {
						return Hub.publish(namespace, message,
								dataTransformer(data));
					}
				}
				return function(data) {
					return Hub.publish(namespace, message,
							Hub.util.merge(data, dataTransformer));
				}
			}
			return function(data) {
				return Hub.publish(namespace, message, data);
			};
		},
		
		util: {
			
			/**
			 * merges the source object into the target object.
			 *
			 * @param {*} target the target value or object
			 * @param {*} source the source value or object
			 * @return {*} the new target value or object
			 */
			merge: function(target, source) {
				if(target === undefined || target === null ||
						target === source) {
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
				Hub.publish("hub.error", "util.merge", {
					type: "validation",
					description: targetType === sourceType ?
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
			},
			
			/**
			 * creates a call chain for the given functions. The returned
			 * chain is a function itself which will invoke all functions in
			 * the given order.
			 * The chain implements remove(Function) which removes one of
			 * the functions from the chain.
			 * 
			 * @param {...Function} the functions to chain
			 * @return {Function} the chain function
			 */
			chain: function() {
				var l = arguments.length - 1;
				var newChain = chain(arguments[l - 1], arguments[l]);
				l--;
				while(l) {
					newChain = chain(arguments[--l], newChain);
				}
				return newChain;
			}
			
		}
	
	};
	
}();