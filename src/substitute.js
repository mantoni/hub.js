/*jslint undef: true*/
/*global Hub, setTimeout, clearTimeout*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * substitutes the given string with the given values by searching for
 * placeholders in the form {dot.separated.path}. If a placeholder is found,
 * Hub.resolve is used to resolve the value from the given values object
 * or array.
 *
 * @param {String} string the string to substitute.
 * @param {Object|Array} values the provided values.
 * @param {*} defaultValue the optional default value.
 * @return {String} the substituted string.
 */
Hub.substitute = function(string, values, defaultValue) {
	if(defaultValue === undefined) {
		defaultValue = "";
	}
	var replaceFn = values ? function(match, path) {
		return Hub.resolve(values, path, defaultValue);
	} : function() {
		return defaultValue;
	};
	return string.replace(/\{([a-zA-Z0-9\.]+)\}/g, replaceFn);
};