/*
 * Copyright (c) 2011 Maximilian Antoni
 */
/**
 * 
 */
Hub = function() {
	
	var nodes = {};
	
	return {
		
		/**
		 * <p>
		 * defines a node in the Hub that publishes and receives messages.
		 * </p>
		 * <p>
		 * Configuration parameters:
		 * </p>
		 * <ul>
		 * <li>is (String|Array): single node name or list of node names
		 * this node inherits from</li>
		 * <li>requires (String|Array): single function name or list of
		 * function names this node requires to be present</li>
		 * <li>scope (String): the scope, either Hub.SINGLETON or
		 * Hub.PROTOTYPE</li>
		 * <li>lazy (Boolean): whether to instantiate the singleton lazy</li>
		 * <li>publishes (String|Array): single topic or list of topics
		 * this node publishes</li>
		 * </ul>
		 * 
		 * @param {String} name the name of the node used as the topic prefix
		 * @param {Object} config the node configuration
		 * @param {Function} factory the factory for the map of listeners
		 */
		node: function(name, config, factory) {
			
		},
		
		/**
		 * <p>
		 * publishes data on the given topic.
		 * </p>
		 * <p>
		 * If forceSync is set to true but any listener can only process the
		 * request asynchronously, an error is thrown.
		 * </p>
		 * 
		 * @param {String} topic the topic
		 * @param {Object} data the data to send
		 * @param {String} responseTopic the optional response topic to use
		 * @param {Boolean} forceSync the optional force synchronization option
		 */
		publish: function(topic, data, responseTopic, forceSync) {
			
		},
		
		/**
		 * <p>
		 * defines a proxy node with the given name that loads a script lazily
		 * expecting the node to be properly defined in the script. Once the
		 * script is loaded the original request made to the proxy is forwarded
		 * to the actual node.
		 * </p>
		 * <p>
		 * If the script does define the expected node an error is thrown. 
		 * </p>
		 */
		proxy: function(name, scriptUrl) {
			
		}	
	
	};
	
}();