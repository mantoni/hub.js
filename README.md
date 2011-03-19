hub.js
======

Tools:
------

* [JsTestDriver](http://code.google.com/p/js-test-driver/)
* [Closure Compiler](http://code.google.com/closure/compiler/)

Running the JsTestDriver test cases:
------------------------------------

1. Start the test server:

        ./build.sh start

2. Open [http://localhost:4224/capture](http://localhost:4224/capture)

3. Run the tests:

        ./build.sh test


Compiling with Closure compiler:
--------------------------------

    ./build.sh compile


Tip for TextMate users:
-----------------------

Create a new command in the bundle editor that saves the current file, takes no input, shows the output as a tooltip and has this content:

    $TM_PROJECT_DIRECTORY/build.sh ct

This will compile and test in one go.
