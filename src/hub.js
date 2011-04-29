/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * 
 */
(function() {
	
	/**
	 * defines a forward for a topic. This allows to define a general purpose
	 * listener or peer and reuse it on different namespaces and messages.
	 * Publishing on a namespace / message pair that matches the forward will
	 * trigger the subscribers on the "real" topic.
	 * 
	 * @param {String} alias the alias for the topic.
	 * @param {String} topic the topic.
	 * @param {Function} dataTransformer the optional function to transform
	 * 			the data on the callback
	 * @param {Object} dataToMerge the optional data to merge with the data
	 * 			on the callback.
	 */
	Hub.forward = function(alias, topic, dataTransformer, dataToMerge) {
		if(typeof alias === "object") {
			for(var k in alias) {
				var t = alias[k];
				if(typeof t === "string") {
					Hub.subscribe(k, Hub.publisher(t));
				}
				else {
					Hub.subscribe(k, Hub.publisher(t[0], t[1], t[2]));
				}
			}
		}
		else {
			Hub.subscribe(alias, Hub.publisher(topic, dataTransformer,
					dataToMerge));
		}
	};
	
	/**
	 * creates a publisher function for a topic. The returned function
	 * publishes the given topic on the hub when invoked.
	 * 
	 * @param {String} topic the topic´to publish.
	 * @param {Function} dataTransformer the optional function to transform
	 * 			the data on the callback
	 * @param {Object} dataToMerge the optional data to merge with the data on
	 * 			the callback
	 * @return {Function} the forwarder function
	 */
	Hub.publisher = function(topic, dataTransformer, dataToMerge) {
		if(typeof topic === "string") {
			if(dataTransformer) {
				if(dataToMerge) {
					return function() {
						return Hub.publish(topic, Hub.util.merge(
							dataTransformer.apply(null, arguments),
							dataToMerge)
						);
					}
				}
				if(typeof dataTransformer === "function") {
					return function() {
						return Hub.publish(topic,
							dataTransformer.apply(null, arguments)
						);
					}
				}
				return function(data) {
					return Hub.publish(topic,
						Hub.util.merge(data, dataTransformer)
					);
				};
			}
			return function() {
				if(arguments.length) {
					return Hub.publish.apply(Hub, [topic].concat(
						Array.prototype.slice.call(arguments)));
				}
				return Hub.publish(topic);
			};
		}
		var api = Hub.chain();
		for(var key in topic) {
			var value = topic[key];
			if(typeof value === "string") {
				api[key] = Hub.publisher(value);
			}
			else {
				api[key] = Hub.publisher.apply(Hub, value);
			}
			api.add(api[key]);
		}
		return api;
	};
	
	/**
	 * creates a new error for the given type, description and optional
	 * context. The description might contain placeholders that get replaced
	 * by values from the context using Hub.util.substitute when calling
	 * toString on the error. The type and context properties are exposed
	 * while the description is not.
	 *
	 * @param {String} type the type of the error.
	 * @param {String} description the description of the error.
	 * @param {Object} context the context for the error.
	 */
	Hub.Error = function(type, description, context) {
		this.type = type;
		this.context = context;
		this.toString = function() {
			return Hub.util.substitute(description, context);
		};
	};
	
	/**
	 * merges the source object into the target object.
	 *
	 * @param {*} target the target value or object
	 * @param {*} source the source value or object
	 * @return {*} the new target value or object
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
	
	/**
	 * resolves a dot notation path from an object. If the path cannot be
	 * resolved, the optional return value is returned.
	 *
	 * @param {Object|Array} object the object.
	 * @param {String} path the path.
	 * @param {*} defaultValue the optional default value.
	 * @return {*} the resolved value or the default value.
	 */
	Hub.util.resolve = function(object, path, defaultValue) {
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
	
	/**
	 * substitutes the given string with the given values by searching for
	 * placeholders in the form {dot.separated.path}. If a placeholder is
	 * found, Hub.util.resolve is used to resolve the value from the given
	 * values object or array.
	 *
	 * @param {String} string the string to substitute.
	 * @param {Object|Array} values the provided values.
	 * @param {*} defaultValue the optional default value.
	 * @return {String} the substituted string.
	 */
	Hub.util.substitute = function(string, values, defaultValue) {
		if(defaultValue === undefined) {
			defaultValue = "";
		}
		var replaceFn = values ? function(match, path) {
			return Hub.util.resolve(values, path, defaultValue);
		} : function() {
			return defaultValue;
		};
		return string.replace(/\{([a-zA-Z0-9\.]+)\}/g, replaceFn);
	};

	
}());