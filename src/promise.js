/*jslint undef: true, white: true*/
/*global hub, clearTimeout, setTimeout*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * adds promises to the hub.
 */
(function () {
	
	/**
	 * The current promise. Also indicates whether currently executing
	 * hub.publish.
	 *
	 * @type {object}
	 */
	var promise = true;
	
	var array_proto = Array.prototype;
	var array_unshift = array_proto.unshift;
	var array_push = array_proto.push;
	var array_slice = array_proto.slice;

	/*
	 * invoke the given callback and pass in the data. If an error occurs
	 * during execution, an error message is published on the hub. Used by
	 * promises to invoke the success or error callbacks.
	 *
	 * @param {Function} callback the callback function.
	 * @param {*} value the value to pass to the callback.
	 */
	function invokePromiseCallback(callback, args, returnArgs) {
		var result;
		try {
			result = callback.apply(null, args);
		} catch (e) {
			hub.invoke("hub.error.promise.callback", new hub.Error("error",
				"Error in promise callback: ${error}", {
					error: e.message
				}));
			return; // TODO test case for whether return args; makes sense
		}
		if (!returnArgs) {
			return;
		}
		if (result === undefined) {
			return args; // retain previous arguments. TODO test case
		}
		// TODO test case for this:
		/*if (Object.prototype.toString.call(result) === "[object Array]") {
			return result;
		}*/
		return [result];
	}
	
	/**
	 * called by a promises resolve() and reject() methods if the promise was
	 * already resolved. Publishes an error message on the hub.
	 */
	function promiseAlreadyResolved() {
		hub.invoke("hub.error.promise.resolved", new hub.Error("validation",
			"Promise already resolved"));
	}
	
	/**
	 * returns the callback to invoke for the given promise when it times out.
	 *
	 * @param {Object} monitoredPromise the promise.
	 */
	function promiseTimeout(monitoredPromise) {
		return function () {
			monitoredPromise.reject({
				type: "timeout"
			});
		};
	}
	
	var joinPromises;
	
	/**
	 * creates a new promise.
	 *
	 * @param {Boolean} resolved whether the promise is initially resolved.
	 * @param {*} value the initial value.
	 * @param {Number} timeout the optional timeout.
	 * @return {Object} the new promise.
	 */
	function createPromise(resolved, value, timeout) {
		var callbacks;
		var errorCallbacks;
		var success = !(value instanceof hub.Error);
		var args = value === undefined ? [] : [value];
		var p;
		// Public API:
		p = {
			/**
			 * @param {Function} callback the success callback.
			 * @param {Function} errorCallback the error callback.
			 * @return {Object} this promise.
			 */
			then: function (callback, errorCallback) {
				if (resolved) {
					var fn = success ? callback : errorCallback;
					if (fn) {
						args = invokePromiseCallback(fn, args, true);
					}
				} else {
					if (callback) {
						callbacks.push(callback);
					}
					if (errorCallback) {
						errorCallbacks.push(errorCallback);
					}
				}
				return this;
			},
			
			/**
			 * publishes the given topic with optional arguments. The return
			 * value of the call will replace the current value of this 
			 * promise.
			 *
			 * @param {String} topic the topic.
			 * @param {...*} arguments the arguments.
			 * @return {Object} this promise.
			 */
			publish: function (topic) {
				if (resolved) {
					args = [hub.invoke.apply(hub, arguments)];
					return this;
				}
				var callArgs = array_slice.call(arguments);
				return this.then(function () {
					args = [hub.invoke.apply(hub, callArgs)];
					// A return value would be meaningless here.
				});
			},
			
			/**
			 * publishes the given topic with the current result of this
			 * promise as the argument. The return value of the call will
			 * replace the current result of this promise.
			 *
			 * @param {String} topic the topic.
			 * @return {Object} this promise.
			 */
			publishResult: function (topic) {
				if (resolved) {
					args = [hub.invoke.apply(hub, [topic].concat(args))];
					return this;
				}
				return this.then(function () {
					args = [hub.invoke.apply(hub, [topic].concat(args))];
					// A return value would be meaningless here.
				});
			},
			
			/**
			 * @param {...*} args the results.
			 * @return {Object} this promise.
			 */
			resolve: function () {
				if (resolved) {
					promiseAlreadyResolved();
				} else {
					resolved = true;
					clearTimeout(timeout);
					if (arguments.length !== 0) {
						args = array_slice.call(arguments);
					}
					while (callbacks.length) {
						invokePromiseCallback(callbacks.shift(), args);
					}
				}
				return this;
			},
			
			/**
			 * @param {*} error the error data.
			 * @return {Object} this promise.
			 */
			reject: function (error) {
				if (resolved) {
					promiseAlreadyResolved();
				} else {
					resolved = true;
					success = false;
					clearTimeout(timeout);
					while (errorCallbacks.length) {
						var callback = errorCallbacks.shift();
						invokePromiseCallback(callback, [error]);
					}
				}
				return this;
			},
			
			/**
			 * @return {Boolean} whether this promise was resolved.
			 */
			resolved: function () {
				return resolved;
			},
			
			join: function (joinPromise) {
				return joinPromises(p, joinPromise);
			}
			
		};
		if (!resolved) {
			callbacks = [];
			errorCallbacks = [];
			timeout = setTimeout(promiseTimeout(p), timeout || 60000);
		}
		return p;
	}
	
	/**
	 * joins the given promises together in a new promise. This means the
	 * returned promise is resolved if the given promises are resolved. If
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
	joinPromises = function joinPromises(p1, p2) {
		var results = [];
		var count = 0;
		var wrapper = createPromise(false);
		var success = true;
		/*
		 * checks whether the promise is done and calls resolve or reject on
		 * the wrapper.
		 */
		function checkDone() {
			if (++count === 2) {
				(success ? wrapper.resolve : wrapper.reject).apply(
					null,
					results
				);
			}
		}
		p1.then(function () {
			array_unshift.apply(results, arguments);
			checkDone();
		}, function () {
			array_unshift.apply(results, arguments);
			success = false;
			checkDone();
		});
		p2.then(function () {
			array_push.apply(results, arguments);
			checkDone();
		}, function (result) {
			array_push.apply(results, arguments);
			success = false;
			checkDone();
		});
		return wrapper;
	};
	
	// Helper function to replace the given proxy with a new promise.
	function replacePromiseProxy(proxy) {
		var real = createPromise(true);
		proxy.then = real.then;
		proxy.publish = real.publish;
		proxy.publishResult = real.publishResult;
		return real;
	}
	
	// The error thrown when trying to resolve an already resolved promise.
	var promiseResolvedError = new Error("hub - promise already resolved");
	
	/*
	 * PromiseProxy is a lightweight object that creates the actual promise
	 * on demand.
	 */
	var PromiseProxy = function () {};
	// Same API as actual promise:
	PromiseProxy.prototype = {
		then: function (success, error) {
			return replacePromiseProxy(this).then(success, error);
		},
		publish: function () {
			return replacePromiseProxy(this).publish.apply(null, arguments);
		},
		publishResult: function (namespace, message, data) {
			return replacePromiseProxy(this).publishResult.apply(
				null,
				arguments
			);
		},
		resolve: function () {
			throw promiseResolvedError;
		},
		reject: function () {
			throw promiseResolvedError;
		},
		resolved: function () {
			return true;
		},
		join: function (promise) {
			return replacePromiseProxy(this).join(promise);
		}
	};
	
	/**
	 * publishes a topic with optional arguments. Invokes the call chain
	 * associated with the given topic and returns either a promise created by
	 * one or more subscribers, or a new promise. Multiple promises are
	 * automatically joined.
	 * The topic combines a namespace and a message in the form:
	 * "{namespace}/{message}".
	 * 
	 * @param {String} topic the topic
	 * @param {...Object} args the arguments to pass
	 */
	hub.publish = function (topic) {
		var previousPromise = promise;
		promise = false;
		var result;
		try {
			result = hub.invoke.apply(this, arguments);
		} catch (e) {
			if (promise && e instanceof hub.Error) {
				promise.reject(e);
				return promise;
			}
			throw e;
		}
		if (typeof result !== "undefined") {
			var p = createPromise(true, result);
			promise = promise ? joinPromises(promise, p) : p;
		}
		var returnPromise = promise;
		promise = previousPromise;
		return returnPromise || new PromiseProxy();
	};
	
	/**
	 * returns a new promise.
	 *
	 * @param {Number} timeout the optional timeout for the promise
	 * @return {Object} the promise
	 */
	hub.promise = function (timeout) {
		var newPromise = createPromise(false, undefined, timeout);
		if (promise === false) {
			// This means we do not have a promise yet.
			promise = newPromise;
		} else if (promise !== true) {
			/*
			 * This means there is an existing promise already which we can
			 * join with the new one.
			 */
			promise = joinPromises(promise, newPromise);
		}
		// Otherwise we can simply the new promise.
		return newPromise;
	};
	
	hub.resetPromise = function () {
		if (typeof promise !== "boolean") {
			promise.reject();
		}
		promise = true;
	};
	
}());