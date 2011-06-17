/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	var scopeProto = {};
	(function () {
		function scopeProtoFn(name) {
			scopeProto[name] = function () {
				var promise = this.promise();
				promise[name].apply(promise, arguments);
			};
		}		
		var names = ["then", "join", "wait", "resolve", "reject"];
		var i = 0, l = names.length;
		for (; i < l; i++) {
			scopeProtoFn(names[i]);
		}
	}());
	
	function scope(args) {
		var iteratorStack = [];
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
				result = arguments[0];
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
			iteratorStack.push(iterator);
		};
		thiz.promise = function () {
			if (!promise) {
				promise = hub.promise();
			}
			return promise;
		};
		return thiz;
	}
	
	hub.scope = scope;
	
}());