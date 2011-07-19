hub.js
======

Separation of concerns with pub/sub multicasting, mixins and promises.

More information: http://mantoni.github.com/hub.js/


Running the JsTestDriver test cases:
------------------------------------

The build script downloads required tools into the lib folder.

1. Start the test server:

        ./build.sh start

2. Open [http://localhost:4224/capture](http://localhost:4224/capture)

3. Run the tests:

        ./build.sh test


Build commands:
--------------------------------

    ./build.sh start    # start JSTestDriver server
    ./build.sh stop     # stop JSTestDriver server
    ./build.sh test     # run JSTestDriver test cases
    ./build.sh compile  # minify with Closure compiler
    ./build.sh lint     # run node-jslint (if installed)
    ./build.sh all      # run test, lint, compile and test on compiled output


References:
--------------------------------

* [Sinon.JS](http://sinonjs.org/)
* [JsTestDriver](http://code.google.com/p/js-test-driver/)
* [Closure Compiler](http://code.google.com/closure/compiler/)
* [Node-JSLint](https://github.com/reid/node-jslint)
