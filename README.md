hub.js
======

Running the JsTestDriver test cases:
------------------------------------

The build script downloads required tools into the lib folder.

1. Start the test server:

        ./build.sh start

2. Open [http://localhost:4224/capture](http://localhost:4224/capture)

3. Run the tests:

        ./build.sh test


Compiling with Closure compiler:
--------------------------------

    ./build.sh compile


JSLint checks:
--------------

    ./build.sh lint


Running it all:
---------------

    ./build.sh all

Runs all tests, JSLint checks, compile and run tests on compiled file again.


Tip for TextMate users:
-----------------------

Create a new command in the bundle editor that saves the current file, takes no input, shows the output as a tooltip and has this content:

    $TM_PROJECT_DIRECTORY/build.sh ct

This will compile and test in one go.


Links:
------

* [Google Group](http://groups.google.com/group/hub-js)
* [JsTestDriver](http://code.google.com/p/js-test-driver/)
* [Closure Compiler](http://code.google.com/closure/compiler/)
* [Node-JSLint](https://github.com/reid/node-jslint)
