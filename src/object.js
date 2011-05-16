/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	function object(fn, args) {
		if (typeof fn !== "function") {
			throw new TypeError();
		}
		var mixed = {};
		var scope = {
			mix: function () {
				var mixin = hub.get.apply(hub, arguments);
				hub.mix(mixed, mixin);
			}
		};
		var result = args ? fn.apply(scope, args) : fn.call(scope);
		return hub.mix(mixed, result);
	}
	
	hub.object = object;
	
}());