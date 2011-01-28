hub.js
======

hub.js wants to provide a foundation for large JavaScript applications.

Whishlist:
----------

* Mixins: Copying the Java inheritance model does not work very well. Mixins are more flexible and fit into the language naturally.
* Scope: People just get confused with "this".
* AOP: Solving cross cutting concerns elegantly.
* Decoupling: "Nodes" send each messages with publish and subscribe.
* Encapsulation: This is often not taken care of.
* Consistent API: Fast to learn, easy to use.
* Small footprint (aiming for < 10kb compressed)

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

