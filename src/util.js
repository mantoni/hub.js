/*jslint undef: true, white: true*/
/*global hub*/
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
hub.resolve = function (object, path, defaultValue) {
	var p = path.indexOf(".");
	while (p !== -1) {
		var key = path.substring(0, p);
		if (!object.hasOwnProperty(key)) {
			return defaultValue;
		}
		object = object[key];
		path = path.substring(p + 1);
		p = path.indexOf(".");
	}
	return object.hasOwnProperty(path) ? object[path] : defaultValue;
};

/**
 * substitutes the given string with the given values by searching for
 * placeholders in the form {dot.separated.path}. If a placeholder is found,
 * hub.resolve is used to resolve the value from the given values object or
 * array.
 *
 * @param {String} string the string to substitute.
 * @param {Object|Array} values the provided values.
 * @param {*} defaultValue the optional default value.
 * @return {String} the substituted string.
 */
hub.substitute = function (string, values, defaultValue) {
	if (defaultValue === undefined) {
		defaultValue = "";
	}
	var replaceFn = values ? function (match, path) {
		return hub.resolve(values, path, defaultValue);
	} : function () {
		return defaultValue;
	};
	return string.replace(/\{([a-zA-Z0-9\.]+)\}/g, replaceFn);
};

/**
 * creates a new error for the given type, description and optional context.
 * The description might contain placeholders that get replaced by values from
 * the context using hub.substitute when calling toString on the error.
 * The type and context properties are exposed while the description is not.
 *
 * @param {String} type the type of the error.
 * @param {String} description the description of the error.
 * @param {Object} context the context for the error.
 */
hub.Error = function (type, description, context) {
	this.type = type;
	this.context = context;
	this.toString = function () {
		return hub.substitute(description, context);
	};
};

/**
 * merges the source object into the target object.
 *
 * @param {*} target the target value or object.
 * @param {*} source the source value or object.
 * @return {*} the new target value or object.
 */
hub.merge = function (target, source) {
	if (target === undefined || target === null || target === source) {
		return source;
	}
	if (source === undefined || source === null) {
		return target;
	}
	var toString = Object.prototype.toString;
	var sourceType = toString.call(source);
	var targetType = toString.call(target);
	var k;
	if (targetType === sourceType) {
		if (sourceType === "[object Object]") {
			for (k in source) {
				if (source.hasOwnProperty(k)) {
					target[k] = hub.merge(target[k], source[k]);
				}
			}
			return target;
		}
		if (sourceType === "[object Array]") {
			return target.concat(source);
		}
	}
	throw new hub.Error("validation",
		targetType === sourceType ?
			"Cannot merge value {target} with {source}" :
			"Cannot merge type {targetType} with {sourceType}", {
				target: target,
				source: source,
				targetType: targetType,
				sourceType: sourceType
			}
	);
};
