#!/bin/bash
#
# Starts the JsTestDriver server.
#
THIS_DIR=`dirname $0`
cd $THIS_DIR/..
mvn -Pjstd validate
