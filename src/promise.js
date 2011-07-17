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
	
	var PromiseDoes = hub.does.define("emit", "on", "un", "create", "factory",
		"peer", "mix", "resolve", "reject"
	);
	var array_slice = Array.prototype.slice;
	var function_string = "function";
	
	var promiseProto = {};
	["on", "un", "emit", "create", "factory", "peer", "mix"].forEach(
		function (name) {
			promiseProto[name] = function () {
				var args = array_slice.call(arguments);
				return this.then(function () {
					hub[name].apply(hub, args.concat(
						Array.prototype.slice.call(arguments)
					));
				});
			};
		}
	);
	
	function joinReject(joined) {
		return function () {
			joined.reject.apply(joined, arguments);
		};
	}
	
	function joinResolve(joined, promise) {
		return function () {
			var args1 = array_slice.call(arguments);
			promise.then(function () {
				var args2 = array_slice.call(arguments);
				joined.resolve.apply(joined, args1.concat(args2));
			});
		};
	}
	
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
		
		function notify() {
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
		
		function resolveReject(args) {
			result = array_slice.call(args);
			if (!blockers) {
				notify();
			}
		}
		
		function thenWait() {
			blockers--;
			if (!blockers && result) {
				notify();
			}
		}
				
		function checkResolved() {
			if (result) {
				throw new Error("Promise already " +
					(rejected ? "rejected" : "resolved"));
			}
		}
		
		thiz = Object.create(promiseProto);
		thiz.then = function (callback, errback) {
			if (!callback && !errback) {
				throw new TypeError("Require callback or errback");
			}
			if (callback && typeof callback !== function_string) {
				throw new TypeError("Callback is " + callback);
			}
			if (errback && typeof errback !== function_string) {
				throw new TypeError("Errback is " + errback);
			}
			if (callback) {
				callbacks.push(callback);
			}
			if (errback) {
				errbacks.push(errback);
			}
			if (!blockers && result) {
				notify();
			}
			return this;
		};
		thiz.resolve = function () {
			checkResolved();
			resolveReject(arguments);
			return this;
		};
		thiz.reject = function () {
			checkResolved();
			rejected = true;
			resolveReject(arguments);
			return this;
		};
		thiz.wait = function () {
			var i = 0, l = arguments.length;
			blockers += l;
			for (; i < l; i++) {
				arguments[i].then(thenWait, thenWait);
			}
			return this;
		};
		thiz.join = function (promise) {
			if (!promise || typeof promise.then !== function_string) {
				throw new TypeError("Promise is " + promise);
			}
			var joined = hub.promise(0, scope);
			this.then(joinResolve(joined, promise), joinReject(joined));
			promise.then(null, joinReject(joined));
			return joined;
		};
		/*thiz.propagate = function () {
			if (!scope) {
				throw new Error("No scope available");
			}
			return this.then(scope.propagate);
		};*/
		thiz.does = new PromiseDoes(thiz);
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
