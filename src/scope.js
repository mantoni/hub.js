/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	var scopeProto = {};
	var array_slice = Array.prototype.slice;
	var array_empty = [];
	
	["then", "join", "wait", "resolve", "reject"].forEach(function (name) {
		scopeProto[name] = function () {
			var promise = this.promise();
			promise[name].apply(promise, arguments);
		};
	});
	
	function scope(object) {
		var iteratorStack = [];
		var promise;
		var result;
		var args = array_empty;
		var thiz = Object.create(scopeProto);
		thiz.aborted = false;
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
					result.then(function () {
						thiz.propagate.apply(thiz, args);
					});
					return result;
				} else if (nextResult && nextResult.then) {
					result = nextResult;
					result.then(function () {
						thiz.propagate.apply(thiz, args);
					});
					return;
				}
				result = hub.merge(result, nextResult);
			}
			return this.propagate.apply(this, args);
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
		thiz.mix = function () {
			return object.mix.apply(object, arguments);
		};
		return thiz;
	}
	hub.scope = scope;
	
	hub.topicScope = function (topic, scope, relative) {
		return hub.root.topicScope(topic, scope, relative);
	};
	
}());
