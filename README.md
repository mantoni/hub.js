hub.js
======

Tools:
------

* Maven (http://maven.apache.org/)
* JsTestDriver (http://code.google.com/p/js-test-driver/)
* Closure Compiler (http://code.google.com/closure/compiler/)

Running the JsTestDriver test cases:
------------------------------------

1. You want JsTestDriver in your Maven repository:

     mvn install:install-file -Dfile=JsTestDriver-1.3.1.jar -DgroupId=com.google.jstestdriver -DartifactId=jstestdriver -Dversion=1.3.1 -Dpackaging=jar

2. Run JsTestDriver server:

     mvn -P jstd validate

3. Point at least one browser at 

     http://localhost:4444/capture

4. Run tests (in a second Terminal):

     mvn test


Concepts
========

The Hub intends to decouple components by using techniques like message multicasting, object factories ("peers"), mixins and promises in one consistent API. It helps structuring your code, encapsulate internal data and encourages non-blocking designs.

Message multicasting
---------------------

The publish / subscribe pattern is used for all component interactions. A user can publish a message on a namespace with some optional data:

    Hub.publish("some.namespace", "my.message", data);

Namespaces and messages are dot separated identifiers. When publishing a message, the namespace might contain single or double asterisks:

    Hub.publish("some.*.namespace", "my.message", data);
    Hub.publish("some.**", "my.message", data);

A single asterisk will match any identifier but stop at a dot while a double asterisk will match any sequence of identifiers across dots.

Subscriptions work in the same way, although it is also possible to subscribe to messages using wildcards:

    Hub.subscribe("some.namespace", "my.message", function(data) { ... });
    Hub.subscribe("some.namespace", "**", function(data) { ... });
    Hub.subscribe("any.**", "pref.*", function(data) { ... });
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

The hub allows users to define "peers" which are instances containing groups of message subscribers for one specific namespace. This is an equivalent to the class concept.

    Hub.peer("some.peer.specific.namespace", function() {
        var privateVar = 123;

        Hub.subscribe("some.other.namespace", "**", function(data) {
			// Subscribed to some.other.namespace/**
		});

        // public API:
        return {
            "one.message": function(data) {
                // Subscribed to some.peer.specific.namespace/one.message
            },
            "another.message": function(data) {
				// Subscribed to some.peer.specific.namespace/another.message
            }
        };
    });
	
Each of the key value pairs returned by the peers factory follow the same semantics as calling the following for each:

    Hub.subscribe("some.peer.specific.namespace", message, callback);

A peers namespace might also contain asterisks to implement a conceptual equivalent to an aspect in AOP.


Mixins
-------

Peers might optionaly receive a configuration object as the second argument. One of the supported configuration options is the "is" property. This can be another peers namespace or an array of namespaces. All listed peers will be resolved and the provided functions are all merged into this peer. If this peer subscribes to the same message as a "super" peer, they form a chain where this peers function is invoked first to allow to override the behavior of another peer.

    Hub.peer("some.peer.specific.namespace", {
        is: ["some.other.peer", "yet.another.peer"]
    }, function() {
        return { ... };
    });
