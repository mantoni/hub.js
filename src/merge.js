/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * merges the source object into the target object.
 *
 * @param {*} target the target value or object.
 * @param {*} source the source value or object.
 * @return {*} the new target value or object.
 */
Hub.util.merge = function(target, source) {
	if(target === undefined || target === null ||
			target === source) {
		return source;
	}
	if(source === undefined || source === null) {
		return target;
	}
	var toString = Object.prototype.toString;
	var sourceType = toString.call(source);
	var targetType = toString.call(target);
	if(targetType === sourceType) {
		if(sourceType === "[object Object]") {
			for(var k in source) {
				target[k] = arguments.callee(target[k], source[k]);
			}
			return target;
		}
		if(sourceType === "[object Array]") {
			return target.concat(source);
		}
	}
	throw new Hub.Error("validation",
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