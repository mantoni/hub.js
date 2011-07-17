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
			var args1 = array_slice.call(arguments);
			return function () {
				var args2 = array_slice.call(arguments);
				return delegate[method].apply(delegate, args1.concat(args2));
			};
		};
	}
	
	function Does(delegate) {
		this._ = delegate;
	}
	Does.prototype = {
		emit: does("emit"),
		on: does("on"),
		un: does("un"),
		create: does("create"),
		factory: does("factory"),
		peer: does("peer"),
		mix: does("mix")
	};
	
	hub.Does = Does;
	hub.does = new Does(hub);
	
}());
