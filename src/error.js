/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * creates a new error for the given type, description and optional context.
 * The description might contain placeholders that get replaced by values from
 * the context using Hub.substitute when calling toString on the error.
 * The type and context properties are exposed while the description is not.
 *
 * @param {String} type the type of the error.
 * @param {String} description the description of the error.
 * @param {Object} context the context for the error.
 */
Hub.Error = function(type, description, context) {
	this.type = type;
	this.context = context;
	this.toString = function() {
		return Hub.substitute(description, context);
	};
};