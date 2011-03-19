/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * adds promises to the hub.
 */
(function() {
	
	/**
	 * The current promise. Also indicates whether currently executing
	 * Hub.publish.
	 *
	 * @type {object}
	 */
	var promise = true;
		
	/*
	 * invoke the given callback and pass in the data. If an error occurs
	 * during execution, an error message is published on the hub. Used by
	 * promises to invoke the success or error callbacks.
	 *
	 * @param {Function} callback the callback function.
	 * @param {*} value the value to pass to the callback.
	 */
	function invokePromiseCallback(callback, value) {
		try {
			callback(value);
		}
		catch(e) {
			Hub.invoke("hub.error/promise.callback", new Hub.Error("error",
				"Error in promise callback: ${error}", {
					error: e.message
				}));
		}
	}
	
	/**
	 * called by a promises fulfill() and reject() methods if the promise was
	 * already fulfilled. Publishes an error message on the hub.
	 */
	function promiseAlreadyFulfilled() {
		Hub.invoke("hub.error/promise.fulfilled", new Hub.Error("validation",
			"Promise already fulfilled"));
	}
	
	/**
	 * returns the callback to invoke for the given promise when it times out.
	 *
	 * @param {Object} monitoredPromise the promise.
	 */
	function promiseTimeout(monitoredPromise) {
		return function() {
			monitoredPromise.reject({
				type: "timeout"
			});
		};
	}
	
	/**
	 * creates a new promise.
	 *
	 * @param {Boolean} fulfilled whether the promise is initially fulfilled.
	 * @param {*} value the initial value.
	 * @param {Number} timeout the optional timeout.
	 * @return {Object} the new promise.
	 */
	function createPromise(fulfilled, value, timeout) {
		var callbacks;
		var errorCallbacks;
		var success = true;
		var timeout;
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
					var fn = success ? callback : errorCallback;
					if(fn) {
						invokePromiseCallback(fn, value);
					}
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
			 * publishes the given topic with optional arguments. The return
			 * value of the call will replace the current value of this promise.
			 *
			 * @param {String} topic the topic.
			 * @param {...*} arguments the arguments.
			 * @return {Object} this promise.
			 */
			publish: function(topic) {
				if(fulfilled) {
					value = Hub.invoke.apply(Hub, arguments);
					return this;
				}
				var args = [topic];
				if(arguments.length > 1) {
					args = args.concat(arguments);
				}
				return this.then(function() {
					value = Hub.invoke.apply(Hub, args);
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
			publishResult: function(topic) {
				if(fulfilled) {
					value = Hub.invoke(topic, value);
					return this;
				}
				return this.then(function() {
					value = Hub.invoke(topic, value);
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
					clearTimeout(timeout);
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
					clearTimeout(timeout);
					while(errorCallbacks.length) {
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
			callbacks = [];
			errorCallbacks = [];
			timeout = setTimeout(promiseTimeout(p), timeout || 60000);
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
		var wrapper = createPromise(false);
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
		proxy.publishResult = real.publishResult;
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
		publish: function() {
			return replacePromiseProxy(this).publish.apply(null, arguments);
		},
		publishResult: function(namespace, message, data) {
			return replacePromiseProxy(this).publishResult.apply(null, arguments);
		},
		fulfill: function() {
			throw new Error("Hub - promise already fulfilled");
		},
		fulfilled: function() {
			return true;
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
	Hub.publish = function(topic) {
		var previousPromise = promise;
		promise = false;
		var result = Hub.invoke.apply(this, arguments);
		if(typeof result !== "undefined") {
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
	Hub.promise = function(timeout) {
		var newPromise = createPromise(false, undefined, timeout);
		if(promise === true) {
			// This means we are not within a publish call.
			return newPromise;
		}
		/*
		 * This means we are within a publish call now. If promise is false it
		 * means we do not have a promise yet. Otherwise there is an existing
		 * promise already which we can join with the new one.
		 */
		if(promise === false) {
			return promise = newPromise;
		}
		promise = joinPromises(promise, newPromise);
		return newPromise;
	};
	
}());