/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	function object(namespace, fn, args) {
		if (typeof namespace !== "string") {
			args = fn;
			fn = namespace;
			namespace = null;
		}
		if (typeof fn !== "function") {
			throw new TypeError();
		}
		var mixed = {};
		var scope = {
			mix: function () {
				var mixin = hub.get.apply(hub, arguments);
				hub.mix(mixed, mixin);
			},
			subscribe: function (message, callback) {
				if (!namespace) {
					throw new TypeError("namespace is " + namespace);
				}
				if (!message) {
					throw new TypeError("messsage is " + message);
				}
				hub.subscribe(namespace + "/" + message, callback);
			}
		};
		var result = args ? fn.apply(scope, args) : fn.call(scope);
		return hub.mix(mixed, result);
	}
	
	hub.object = object;
	
}());