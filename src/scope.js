/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	var scopeProto = {};
	["then", "join", "wait", "resolve", "reject"].forEach(function (name) {
		scopeProto[name] = function () {
			var promise = this.promise();
			promise[name].apply(promise, arguments);
		};
	});
	
	function scope(args) {
		var iteratorStack;
		var aborted = false;
		var promise;
		var result;
		var thiz = Object.create(scopeProto);
		function boundPropagate() {
			return thiz.propagate();
		}
		/**
		 * stops message propagation for the current call chain.
		 */
		thiz.stopPropagation = function () {
			aborted = true;
			if (iteratorStack) {
				iteratorStack.length = 0;
			}
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
				//result = arguments[0];
				args = Array.prototype.slice.call(arguments);
			}
			var size = iteratorStack ? iteratorStack.length : 0;
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
		thiz.aborted = function () {
			return aborted;
		};
		thiz.result = function () {
			if (result && result.then) {
				return result;
			}
			return hub.promise(0, this).resolve(result);
		};
		thiz.push = function (iterator) {
			if (!iteratorStack) {
				iteratorStack = [];
			}
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
	
}());