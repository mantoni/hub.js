hub.js
======

Tools:
------

* Maven
* JsTestDriver
* Plans to use JsDoc and Closure compiler

Running the test cases:
-----------------------

1. Run JsTestDriver server:
     mvn -P jstd validate
2. Point at least one browser at http://localhost:4444/capture
3. Run tests (in a second Terminal):
     mvn test


Concepts
========

This is a JavaScript implementation of a general programming concept focusing on these three techniques:

Message multi-casting
---------------------

The publish / subscribe pattern is used for all component interactions. A user can publish a message on a namespace with some optional data:

    Hub.publish("some.namespace", "my.message", data);

Namespaces and messages are dot separated identifiers. When publishing a message, the namespace might contain single or double asterisks:

    Hub.publish("some.*.namespace", "my.message", data);
    Hub.publish("some.**", "my.message", data);

A single asterisk will match any identifier but stop at a dot while a double asterisk will match any sequence of identifiers across dots.

Subscriptions work in the same way, although it is also possible to subscribe to messages using wildcards:

    Hub.subscribe("some.namespace", "my.message", function(data) { ... });
    Hub.subscribe("some.*.namespace", "my.message", function(data) { ... });
    Hub.subscribe("some.**", "my.message", function(data) { ... });
    Hub.subscribe("some.namespace", "my.*.message", function(data) { ... });
    Hub.subscribe("some.namespace", "my.**", function(data) { ... });
    Hub.subscribe("some.*.namespace", "my.*.message", function(data) { ... });
    Hub.subscribe("some.**", "my.**", function(data) { ... });
    Hub.subscribe("**", "**", function(data) { ... });

If more than one subscription matches a published message, the subscriptions with asterisks are notified first which allows to apply AOP style concepts. In a second step the concrete subscriptions are notified in reverse order of subscribe calls. This allows to apply "overriding" semantics.

To forward a message to the next subscriber explicitly, Hub.propagate() can be used. A promise is returned to allow further processing after the "super" implementation completes execution (might be asynchronous):

    Hub.subscribe("some.namespace", "my.message", function(data) {
        // some logic here
        return Hub.propagate().then(function() {
            // some more logic here
        });
    });

Message propagation can also be stopped:

    Hub.subscribe("some.namespace", "my.message", function(data) {
        // some logic here
        Hub.stopPropagation();
    });


Object factory
--------------

The hub allows users to install "nodes" which are instances containing groups of message subscribers for one specific namespace. This is an equivalent to the class concept.

    Hub.node("some.node.specific.namespace", function() {
        var privateVar = 123;

        Hub.subscribe("some.other.namespace", "**", function(data) {
			// Subscribed to some.other.namespace/**
		});

        return {
            "one.message": function(data) {
                // Subscribed to some.node.specific.namespace/one.message
            },
            "another.message": function(data) {
				// Subscribed to some.node.specific.namespace/another.message
            }
        };
    });
	
Each of the key value pairs returned by the nodes factory follow the same semantics as calling the following for each:

    Hub.subscribe("some.node.specific.namespace", key, callback);

A nodes namespace might also contain asterisks to implement a conceptual equivalent to an aspect in AOP.


Mix-ins
-------

Nodes might optionaly receive a configuration object as the second argument. One of the supported configuration options is the "is" property. This can be another nodes namespace or an array of namespaces. All listed nodes will be resolved and the provided functions are all merged into this node. If this node subscribes to the same message as a "super" node, they form a chain where this nodes function is invoked first to allow to override the behavior of another node.

    Hub.node("some.node.specific.namespace", {
        is: ["some.other.node", "yet.another.node"]
    }, function() {
        return { ... };
    });
