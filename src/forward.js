/*jslint undef: true, white: true*/
/*global hub*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/**
 * defines a forward for a topic. This allows to define a general purpose
 * listener or peer and reuse it on different namespaces and messages.
 * Publishing on a namespace / message pair that matches the forward will
 * trigger the subscribers on the "real" topic.
 * 
 * @param {String} alias the alias for the topic.
 * @param {String} topic the topic.
 * @param {Function} dataTransformer the optional function to transform
 *			the data on the callback
 * @param {Object} dataToMerge the optional data to merge with the data
 *			on the callback.
 */
(function () {
	var emitter = hub.emitter;
	var on = hub.on;
	
	hub.forward = function (alias, topic, dataTransformer, dataToMerge) {
		if (typeof alias === "object") {
			var k, t;
			for (k in alias) {
				if (alias.hasOwnProperty(k)) {
					t = alias[k];
					if (typeof t === "string") {
						on(k, emitter(t));
					} else {
						on(k, emitter(t[0], t[1], t[2]));
					}
				}
			}
		} else {
			on(alias, emitter(topic, dataTransformer, dataToMerge));
		}
	};
}());