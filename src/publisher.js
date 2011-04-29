/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * creates a publisher function for a topic. The returned function publishes
 * the given topic on the hub when invoked.
 * 
 * @param {String} topic the topic´to publish.
 * @param {Function} dataTransformer the optional function to transform the
 * 			data on the callback
 * @param {Object} dataToMerge the optional data to merge with the data on the
 * 			callback
 * @return {Function} the forwarder function
 */
Hub.publisher = function(topic, dataTransformer, dataToMerge) {
	if(typeof topic === "string") {
		if(dataTransformer) {
			if(dataToMerge) {
				return function() {
					return Hub.publish(topic, Hub.merge(
						dataTransformer.apply(null, arguments), dataToMerge));
				}
			}
			if(typeof dataTransformer === "function") {
				return function() {
					return Hub.publish(topic,
						dataTransformer.apply(null, arguments));
				}
			}
			return function(data) {
				return Hub.publish(topic,
					Hub.merge(data, dataTransformer));
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