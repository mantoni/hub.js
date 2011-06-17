/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	/*
	 * adds a function to the given object under the specified key.
	 */
	function apply(object, key, fn) {
		var c = object[key];
		if (!c) {
			object[key] = hub.chain(fn);
		} else if (c.add) {
			c.add(fn);
		} else {
			object[key] = hub.chain(fn, object[key]);
		}
	}
	
	/*
	 * applies a mix-in to an object.
	 */
	function mix(object, mixin) {
		var key;
		for (key in mixin) {
			if (mixin.hasOwnProperty(key) &&
					typeof mixin[key] === "function") {
				apply(object, key, mixin[key]);
			}
		}
		return object;
	}
	
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
	
	function factory(topic, fn) {
		return function () {
			return hub.create(topic, fn);
		};
	}
	
	hub.mix = mix;
	hub.create = create;
	hub.factory = factory;
	
}());