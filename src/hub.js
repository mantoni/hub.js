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
	 * the empty function for internal use only.
	 *
	 * @type {Function}
	 */
	var emptyFn = function() {};
	
	/**
	 * topic to subscriber functions.
	 *
	 * @type {object}
	 */
	var subscribers = {};
	var wildcardSubscribers = {};
	
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
	 * The arguments to pass to nextFn.
	 *
	 * @type {Array}
	 */
	var nextArguments;
	
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
	 * All path matcher regular expressions.
	 *
	 * @type {object}
	 */
	var pathMatchers = {};
	
	/**
	 * @type {number}
	 */	
	var monitorTimeout;
	/**
	 * @type {number}
	 */	
	var onceTimeout;
	/**
	 * @type {number}
	 */	
	var promiseCounter = 0;
	/**
	 * @type {number}
	 */	
	var now;
			
	/**
	 * creates a call chain for the given functions.
	 */
	function chain(first, second) {
		var newChain = function() {
			if(!first) {
				return second.apply(null, arguments);
			}
			if(!second) {
				return first.apply(null, arguments);
			}
			else {
				var previousFn = nextFn;
				nextFn = second;
				nextArguments = arguments;
				try {
					var result = first.apply(null, arguments);
					if(nextFn) {
						result = Hub.util.merge(result, second.apply(null, arguments));
					}
					return result;
				}
				finally {
					nextFn = previousFn;
					nextarguments = undefined;
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
	 * creates a peer for the peer definition with the given name.
	 */
	function createPeer(namespace) {
		var peer = {}, definition = definitions[namespace];
		if(definition) {
			var is = argArray(definition.is);
			for(var i = 0, mixin; mixin = is[i++];) {
				mix(peer, getPeer(mixin));
			}
			mix(peer, definition.factory());
		}
		return peer;
	}
	
	function pathMatcher(name) {
		var matcher = pathMatchers[name];
		if(matcher) {
			return matcher;
		}
		var exp = name.replace(/\./g, "\\.").replace(
			/\*\*/g, "[a-zA-Z0-9\\.]+").replace(/\*/g, "[a-zA-Z0-9]+");
		return pathMatchers[name] = new RegExp("^" + exp + "$");
	}
	
	/*
	 * returns a peer instance for the definition with the given topic.
	 */
	function getPeer(namespace) {
		return peers[namespace] || createPeer(topic);
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
	
	function peerFactory(namespace) {
		return function() {
			var peer = createPeer(namespace);
			wirePeer(peer, namespace);
			Hub.propagate();
			unwirePeer(peer, namespace);
		};
	}
	
	function wirePeer(peer, namespace) {
		for(var message in peer) {
			Hub.subscribe(namespace + "/" + message, peer[message]);
		}
	}
	
	function unwirePeer(peer, namespace) {
		for(var message in peer) {
			Hub.unsubscribe(namespace + "/" + message, peer[message]);
		}
	}
	
	function substitutionFn(topic) {
		return function() {
			invoke(Hub.util.substitute(topic, arguments), arguments);
		};
	}
	
	function validateTopic(topic) {
		var type = typeof topic;
		if(type !== "string") {
			throw new Error("Topic is not string: " + type);
		}
		if(!topic) {
			throw new Error("Topic is empty");
		}
		if(!(/^[a-zA-Z0-9\.\{\}\*]+(\/[a-zA-Z0-9\.\{\}\*]+)?$/.test(topic))) {
			throw new Error("Illegal topic: " + topic);
		}
	}
	
	function createTopicFunction(topic, fn) {
		validateTopic(topic);
		var match, re, t;
		if(topic.indexOf("{") !== -1) {
			match = substitutionFn(topic);
		}
		if(topic.indexOf("*") !== -1) {
			re = pathMatcher(topic);
			for(t in subscribers) {
				if(re.test(t)) {
					var subscriber = subscribers[t];
					match = match ? chain(match, subscriber) : subscriber;
				}
			}
			wildcardSubscribers[topic] = re;
		}
		else {
			for(t in wildcardSubscribers) {
				re = wildcardSubscribers[t];
				if(re.test(topic)) {
					match = match ? chain(match, subscribers[t]) : subscribers[t];
				}
			}
		}
		return subscribers[topic] = match && fn ? chain(match, fn) : (match || fn || emptyFn);
	}
	
	function unchainSubscriber(topic, fn) {
		var topicFn = subscribers[topic];
		if(topicFn === fn) {
			delete subscribers[topic];
		}
		else {
			topicFn.remove(fn);
		}
	}
	
	function invoke(topic, args) {
		var topicFn = subscribers[topic] || createTopicFunction(topic);
		try {
			return topicFn.apply(null, args);
		}
		catch(e) {
			var errorTopic = "hub.error/publish";
			if(topic === errorTopic) {
				throw e;
			}
			invoke(errorTopic, [new Hub.Error("error",
				"Error in callback for topic \"{topic}\": {error}", {
					topic: topic, error: e.message
				})]
			);
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
	 * @param {*} value the value to pass to the callback.
	 */
	function invokePromiseCallback(callback, value) {
		if(callback) {
			try {
				callback(value);
			}
			catch(e) {
				invoke("hub.error/promise.callback", [new Hub.Error("error",
					"Error in promise callback: ${error}", {
						error: e.message
					})]);
			}
		}
	}
	
	/*
	 * called by a promises fulfill() and reject() methods if the promise was
	 * already fulfilled. Publishes an error message on the hub.
	 */
	function promiseAlreadyFulfilled() {
		invoke("hub.error/promise.fulfilled", [new Hub.Error("validation",
			"Promise already fulfilled")]);
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
			 * @param {String} topic the topic.
			 * @param {*} arguments the arguments.
			 * @return {Object} this promise.
			 */
			publish: function(topic) {
				if(fulfilled) {
					return Hub.publish.apply(Hub, arguments);
				}
				var args = [topic];
				if(arguments.length > 1) {
					args = args.concat(arguments);
				}
				return this.then(function() {
					return Hub.publish.apply(Hub, args);
					// A return value would be meaningless here.
				});
			},
			/**
			 * @param {*} value the value.
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
	
	// ensures the given argument is a function. Throws an error otherwise.
	function validateCallback(fn) {
		var fnType = typeof fn;
		if(fnType !== "function") {
			throw new Error("Callback is not function: " + fnType);
		}
	}
	
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
			subscribers = {};
			wildcardSubscribers = {};
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
		 * subscribes a callback function to the given topic.
		 * 
		 * @param {string} topic the topic.
		 * @param {function(object)} fn the callback function.
		 */
		subscribe: function(topic, fn) {
			validateCallback(fn);
			var topicFn = subscribers[topic];
			if(!topicFn || topicFn === emptyFn) {
				createTopicFunction(topic, fn);
			}
			else {
				validateTopic(topic);
				subscribers[topic] = chain(fn, topicFn);
			}
			for(var t in wildcardSubscribers) {
				var re = wildcardSubscribers[t];
				if(re.test(topic)) {
					subscribers[t] = chain(fn, subscribers[t]);
				}
			}
//			subscribers[topic] = topicFn && topicFn !== emptyFn ?
//					chain(fn, topicFn) : fn;
		},
		
		/**
		 * unsubscribes a callback function from the given topic.
		 *
		 * @param {string} topic the topic.
		 * @param {function(object)} fn the callback function.
		 * @return {Boolean} false if the callback was not registered,
		 *			otherwise true.
		 */
		unsubscribe: function(topic, fn) {
			validateCallback(fn);
			var topicFn = subscribers[topic];
			if(!topicFn) {
				validateTopic(topic);
				return false;
			}
			unchainSubscriber(topic, fn);
			for(var t in wildcardSubscribers) {
				var re = wildcardSubscribers[t];
				if(re.test(topic)) {
					unchainSubscriber(t, fn);
				}
			}
			return true;
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
			if(!config.scope || config.scope === Hub.SINGLETON) {
				var peer = peers[namespace] = createPeer(namespace);
				wirePeer(peer, namespace);
			}
			else {
				Hub.subscribe(namespace + "/**", peerFactory(namespace));
			}
		},
		
		/**
		 * publishes a topic along with optional arguments.
		 * The topic consists of a namespace and a message in the form:
		 * "{namespace}/{message}".
		 * 
		 * @param {String} topic the topic
		 * @param {...Object} args the arguments to pass
		 */
		publish: function(topic) {
			var previousPromise = promise;
			promise = false;
			var args = arguments.length > 1 ?
					Array.prototype.slice.call(arguments, 1) : emptyArray;
			var result = invoke(topic, args);
			if(result !== undefined) {
				var p = createPromise(true, result);
				promise = promise ? joinPromises(promise, p) : p;
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
			nextFn.apply(null, nextArguments);
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
		 * @param {String} alias the alias for the topic
		 * @param {String} topic the topic
		 * @param {Function} dataTransformer the optional function to transform
		 * 			the data on the callback
		 * @param {Object} dataToMerge the optional data to merge with the data
		 * 			on the callback
		 */
		forward: function(alias, topic, dataTransformer, dataToMerge) {
			if(typeof alias === "object") {
				for(var k in alias) {
					var t = alias[k];
					if(typeof t === "string") {
						Hub.subscribe(k, Hub.publisher(t));
					}
					else {
						Hub.subscribe(k, Hub.publisher(t[0], t[1], t[2]));
					}
				}
			}
			else {
				Hub.subscribe(alias, Hub.publisher(topic, dataTransformer,
						dataToMerge));
			}
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
		 * @param {String} topic the topic to forward to
		 * @param {Function} dataTransformer the optional function to transform
		 * 			the data on the callback
		 * @param {Object} dataToMerge the optional data to merge with the data
		 * 			on the callback
		 * @return {Function} the forwarder function
		 */
		publisher: function(topic, dataTransformer, dataToMerge) {
			if(dataTransformer) {
				if(dataToMerge) {
					return function() {
						return Hub.publish(topic, Hub.util.merge(
							dataTransformer.apply(null, arguments),
							dataToMerge)
						);
					}
				}
				if(typeof dataTransformer === "function") {
					return function() {
						return Hub.publish(topic,
							dataTransformer.apply(null, arguments)
						);
					}
				}
				return function(data) {
					return Hub.publish(topic,
						Hub.util.merge(data, dataTransformer)
					);
				}
			}
			return function(data) {
				return Hub.publish(topic, data);
			};
		},
		
		/**
		 * creates a new error for the given type, description and optional
		 * context. The description might contain placeholders that get
		 * replaced by values from the context using Hub.util.substitute
		 * when calling toString on the error.
		 * The type and context properties are exposed while the description
		 * is not.
		 *
		 * @param {String} type the type of the error.
		 * @param {String} description the description of the error.
		 * @param {Object} context the context for the error.
		 */
		Error: function(type, description, context) {
			function toString() {
				return Hub.util.substitute(description, this.context);
			}
			return {
				toString: toString,
				type: type,
				context: context || {}
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
				var toString = Object.prototype.toString;
				var sourceType = toString.call(source);
				var targetType = toString.call(target);
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
				invoke("hub.error/util.merge", [new Hub.Error("validation",
					targetType === sourceType ?
						"Cannot merge value {target} with {source}" :
						"Cannot merge type {targetType} with {sourceType}", {
							target: target,
							source: source,
							targetType: targetType,
							sourceType: sourceType
						}
				)]);
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
			},
			
			/**
			 * resolves a dot notation path from an object.
			 * If the path cannot be resolved, the optional
			 * return value is returned.
			 *
			 * @param {Object|Array} object the object.
			 * @param {String} path the path.
			 * @param {*} defaultValue the optional default value.
			 * @return {*} the resolved value or the default value.
			 */
			resolve: function(object, path, defaultValue) {
				var p = path.indexOf(".");
				if(p !== -1) {
					var key = path.substring(0, p);
					if(key in object) {
						return arguments.callee(object[key],
							path.substring(p + 1), defaultValue);
					}
					return defaultValue;
				}
				return path in object ? object[path] : defaultValue;
			},
			
			/**
			 * substitutes the given string with the given values by searching
			 * for placeholders in the form {dot.separated.path}. If a
			 * placeholder is found, Hub.util.resolve is used to resolve the
			 * value from the given values object or array.
			 *
			 * @param {String} string the string to substitute.
			 * @param {Object|Array} values the provided values.
			 * @param {*} defaultValue the optional default value.
			 * @return {String} the substituted string.
			 */
			substitute: function(string, values, defaultValue) {
				if(defaultValue === undefined) {
					defaultValue = "";
				}
				var replaceFn = values ? function(match, path) {
					return Hub.util.resolve(values, path, defaultValue);
				} : function() {
					return defaultValue;
				};
				return string.replace(/\{([a-zA-Z0-9\.]+)\}/g, replaceFn);
			}
			
		}
	
	};
	
}();