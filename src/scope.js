/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	var scopeProto = {};
	var scopeFunctionCache = {};
	var array_slice = Array.prototype.slice;
	
	["then", "join", "wait", "resolve", "reject"].forEach(function (name) {
		scopeProto[name] = function () {
			var promise = this.promise();
			promise[name].apply(promise, arguments);
		};
	});
	
	function scope(args) {
		var iteratorStack = [];
		var promise;
		var result;
		var thiz = Object.create(scopeProto);
		thiz.aborted = false;
		function boundPropagate() {
			return thiz.propagate();
		}
		/**
		 * stops message propagation for the current call chain.
		 */
		thiz.stopPropagation = function () {
			thiz.aborted = true;
			iteratorStack.length = 0;
			if (arguments.length) {
				result = arguments[0];
			}
		};
		/**
		 * propagates the message to the next function in the current call
		 * chain.
		 */
		thiz.propagate = function () {
			if (arguments.length) {
				args = array_slice.call(arguments);
			}
			var size = iteratorStack.length;
			if (!size) {
				return this.result();
			}
			var iterator = iteratorStack[size - 1];
			if (!iterator.hasNext) {
				iterator.reset();
				iteratorStack.pop();
			} else {
				var nextResult = iterator().apply(this, args);
				if (promise) {
					result = promise;
					promise = undefined;
					result.then(boundPropagate);
					return result;
				} else if (nextResult && nextResult.then) {
					result = nextResult;
					result.then(boundPropagate);
					return;
				}
				result = hub.merge(result, nextResult);
			}
			return this.propagate();
		};
		thiz.result = function () {
			if (result && result.then) {
				return result;
			}
			return hub.promise(0, this).resolve(result);
		};
		thiz.push = function (iterator) {
			iteratorStack.push(iterator);
		};
		thiz.promise = function (timeout, scope) {
			if (!promise) {
				promise = hub.promise(timeout || 0, scope || this);
			}
			return promise;
		};
		return thiz;
	}
	hub.scope = scope;
	
	function scoped(topic, fn) {
		if (topic) {
			topic += ".";
		}
		return function () {
			var args = array_slice.call(arguments);
			if (!args[0]) {
				throw new TypeError("Topic is " + args[0]);
			}
			args[0] = topic + args[0];
			return fn.apply(hub, args);
		};
	}
	
	hub.topicScope = function (topic, scope) {
		if (!scope) {
			scope = hub.scope();
		}
		var p = topic.lastIndexOf(".");
		var namespace = p === -1 ? "" : topic.substring(0, p);
		var cache = scopeFunctionCache[namespace];
		if (!cache) {
			cache = {
				on: scoped(namespace, hub.on),
				un: scoped(namespace, hub.un),
				peer: scoped(namespace, hub.peer),
				emit: scoped(namespace, hub.emit),
				create: scoped(namespace, hub.create),
				factory: scoped(namespace, hub.factory)
			};
			scopeFunctionCache[namespace] = cache;
		}
		scope.topic = topic;
		scope.on = cache.on;
		scope.un = cache.un;
		scope.peer = cache.peer;
		scope.emit = cache.emit;
		scope.create = cache.create;
		scope.factory = cache.factory;
		return scope;
	};
	
	var reset = hub.reset;
	hub.reset = function () {
		scopeFunctionCache = {};
		reset();
	};
	
}());