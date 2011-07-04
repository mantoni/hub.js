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
			var args1 = array_slice.call(arguments);
			return function () {
				var args2 = array_slice.call(arguments);
				return hub[method].apply(hub, args1.concat(args2));
			};
		};
	}
	
	hub.does = {
		emit: does("emit"),
		on: does("on"),
		un: does("un"),
		create: does("create"),
		factory: does("factory"),
		peer: does("peer")
	};
	
}());
