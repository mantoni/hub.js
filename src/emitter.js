/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * creates an emitter function for a topic. The returned function publishes
 * the given topic on the hub when invoked.
 * 
 * @param {String} topic the topic to emit.
 * @param {Function} dataTransformer the optional function to transform the
 *			data on the callback
 * @param {Object} dataToMerge the optional data to merge with the data on the
 *			callback
 * @return {Function} the forwarder function
 */
(function () {
	var emit = hub.emit;
	var merge = hub.merge;
	
	hub.emitter = function (topic, dataTransformer, dataToMerge) {
		if (typeof topic === "string") {
			if (dataTransformer) {
				if (dataToMerge) {
					return function () {
						return emit(topic, merge(dataTransformer.apply(
							null,
							arguments
						), dataToMerge));
					};
				}
				if (typeof dataTransformer === "function") {
					return function () {
						return emit(topic, dataTransformer.apply(
							null,
							arguments
						));
					};
				}
				return function (data) {
					return emit(topic, merge(data, dataTransformer));
				};
			}
			return function () {
				if (arguments.length) {
					return emit.apply(hub, [topic].concat(
						Array.prototype.slice.call(arguments)
					));
				}
				return emit(topic);
			};
		}
		var api = hub.chain();
		var key;
		for (key in topic) {
			if (topic.hasOwnProperty(key)) {
				var value = topic[key];
				if (typeof value === "string") {
					api[key] = hub.emitter(value);
				} else {
					api[key] = hub.emitter.apply(hub, value);
				}
				api.on(api[key]);
			}
		}
		return api;
	};
}());