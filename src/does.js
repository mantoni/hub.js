/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
(function () {
	
	var array_slice = Array.prototype.slice;
	
	function does(method) {
		return function () {
			var delegate = this._;
			var type = typeof delegate[method];
			if (type !== "function") {
				throw new TypeError(method + " is " + type);
			}
			var args1 = array_slice.call(arguments);
			return function () {
				var args2 = array_slice.call(arguments);
				return delegate[method].apply(delegate, args1.concat(args2));
			};
		};
	}
	
	function define() {
		var proto = {};
		array_slice.call(arguments).forEach(function (name) {
			proto[name] = does(name);
		});
		function F(delegate) {
			this._ = delegate;
		}
		F.prototype = proto;
		return F;
	}
	var HubDoes = define("emit", "on", "un", "create", "factory", "peer",
		"mix");
	hub.does = new HubDoes(hub);
	hub.does.define = define;
	
}());
