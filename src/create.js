/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	function create(topic, fn, args) {
		if (typeof topic !== "string") {
			args = fn;
			fn = topic;
			topic = null;
		}
		if (typeof fn !== "function") {
			throw new TypeError();
		}
		var object = {};
		var scope = topic ? hub.topicScope(topic) : hub.scope();
		scope.mix = function () {
			hub.emit.apply(hub, arguments).then(function (mixin) {
				hub.mix(object, mixin);
			});
		};
		var result = args ? fn.apply(scope, args) : fn.call(scope);
		return hub.mix(object, result);
	}
	
	hub.create = create;
	
}());