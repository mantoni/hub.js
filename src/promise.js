/*jslint undef: true, white: true*/
/*global hub, clearTimeout, setTimeout*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * promises.
 */
(function () {

	/**
	 * returns a new promise.
	 *
	 * @param {Number} timeout the optional timeout for the promise.
	 * @param {Object} scope the optional scope to use in callback functions.
	 * @return {Object} the promise.
	 */
	hub.promise = function (timeout, scope) {
		var callbacks = [];
		var errbacks = [];
		var result;
		var blockers = 0;
		var rejected = false;
		var timer;
		var thiz;
		
		function resolve() {
			if (timer) {
				clearTimeout(timer);
			}
			var fns = rejected ? errbacks : callbacks;
			var i = 0, l = fns.length;
			for (; i < l; i++) {
				fns[i].apply(scope, result);
			}
			callbacks.length = 0;
			errbacks.length = 0;
		}
		
		function thenWait() {
			blockers--;
			if (!blockers && result) {
				resolve();
			}
		}
		
		thiz = {
			then: function (callback, errback) {
				if (typeof callback !== "function") {
					throw new TypeError("Callback is " + callback);
				}
				callbacks.push(callback);
				if (errback) {
					errbacks.push(errback);
				}
				if (!blockers && result) {
					resolve();
				}
				return thiz;
			},
			resolve: function () {
				if (result) {
					throw new Error("Promise already " +
						(rejected ? "rejected" : "resolved"));
				}
				result = Array.prototype.slice.call(arguments);
				if (!blockers) {
					resolve();
				}
				return thiz;
			},
			reject: function () {
				rejected = true;
				return thiz.resolve.apply(thiz, arguments);
			},
		/*	resolved: function () {
				return Boolean(result);
			},*/
			wait: function () {
				var i = 0, l = arguments.length;
				blockers += l;
				for (; i < l; i++) {
					arguments[i].then(thenWait);
				}
				return thiz;
			},
			join: function (promise) {
				if (!promise || typeof promise.then !== "function") {
					throw new TypeError("Promise is " + promise);
				}
				var joined = hub.promise();
				thiz.then(function (result1) {
					promise.then(function (result2) {
						joined.resolve(result1, result2);
					});
				});				
				return joined;
			},
			emit: function (topic) {
				thiz.then(function () {
					hub.emit.apply(hub, [topic].concat(result));
				});
			}
		};
		if (timeout) {
			timer = setTimeout(function () {
				thiz.reject(new hub.Error("timeout",
					"Promise timed out after {timeout} milliseconds", {
						timeout: timeout
					}
				));
			}, timeout);
		}
		return thiz;
	};

}());
