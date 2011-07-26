/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	function assertFunction(fn) {
		if (typeof fn !== "function") {
			throw new TypeError();
		}
	}
	
	function chain(object, key, fn) {
		var c = object[key];
		if (!c) {
			object[key] = hub.chain(fn);
		} else if (c.add) {
			c.add(fn);
		} else {
			object[key] = hub.chain(fn, object[key]);
		}
	}
	
	function mix(object, mixin) {
		var key;
		for (key in mixin) {
			if (mixin.hasOwnProperty(key) &&
					typeof mixin[key] === "function") {
				chain(object, key, mixin[key]);
			}
		}
		return object;
	}
	
	function create(topic, fn) {
		var args = Array.prototype.slice.call(arguments, 2);
		if (typeof topic !== "string") {
			args.unshift(fn);
			fn = topic;
			topic = null;
		}
		assertFunction(fn);
		var object = {};
		var scope = this.propagate ? this : hub.scope();
		if (topic) {
			scope = hub.topicScope(topic, scope);
		}
		scope.mix = function () {
			return hub.apply("emit", arguments).then(hub.does.mix(object));
		};
		var result = args ? fn.apply(scope, args) : fn.call(scope);
		return hub.mix(object, result);
	}
	
	function factory(topic, fn) {
		if (typeof topic !== "string") {
			assertFunction(topic);
		} else {
			assertFunction(fn);
		}
		return function () {
			return hub.create(topic, fn);
		};
//		return hub.does.create(topic, fn);
	}
	
	hub.mix = mix;
	hub.create = create;
	hub.factory = factory;
	
}());
