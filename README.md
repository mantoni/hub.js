hub.js
======

Hub.js helps developing message driven applications in JavaScript.

Tooling
-------

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

