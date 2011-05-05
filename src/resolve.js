/*jslint undef: true*/
/*global Hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * resolves a dot notation path from an object. If the path cannot be
 * resolved, the optional return value is returned.
 *
 * @param {Object|Array} object the object.
 * @param {String} path the path.
 * @param {*} defaultValue the optional default value.
 * @return {*} the resolved value or the default value.
 */
Hub.resolve = function(object, path, defaultValue) {
	var p = path.indexOf(".");
	if(p !== -1) {
		var key = path.substring(0, p);
		if(key in object) {
			return arguments.callee(object[key],
				path.substring(p + 1), defaultValue);
		}
		return defaultValue;
	}
	return path in object ? object[path] : defaultValue;
};
