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
			object[key] = fn;
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
	
	hub.mix = mix;
	
}());