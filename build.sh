#!/bin/bash
#
# Copyright (c) 2011 Maximilian Antoni
#
# Build script for hub.js.
#
# Options:
# - compile | c: compile source files using Google Closure compiler
# - test | t: run test cases with JsTestDriver
# - ct: combined compile and test
# - start: start the JsTestDriver server
# - stop: stop the JsTestDriver server
#

# hub.js version to build:
HUB_VERSION="0.1-SNAPSHOT"

# Closure Compiler version:
CC_VERSION="20110119"

# JsTestDriver version:
JSTD_VERSION="1.3.1"


CC_FILENAME="compiler-$CC_VERSION.jar"
CC_TAR="compiler-$CC_VERSION.tar.gz"
CC_DOWNLOAD="http://closure-compiler.googlecode.com/files/$CC_TAR"

JSTD_FILENAME="JsTestDriver-$JSTD_VERSION.jar"
JSTD_DOWNLOAD="http://js-test-driver.googlecode.com/files/$JSTD_FILENAME"

download() {
	if [ ! -e lib ]; then
		mkdir lib
	fi
	if [ -z `type -P wget` ]; then
		curl -o "lib/$1" $2
	else
		wget -O "lib/$1" $2
	fi
	if [ $? -ne 0 ]; then
		exit 1
	fi
	if [ ! -e lib/$1 ]; then
		echo "Download FAILED"
		exit 1
	fi
}

check_cc() {
	if [ ! -e lib/$CC_FILENAME ]; then
		echo "
Missing Closure compiler - Downloading to lib/$CC_FILENAME
"
		download $CC_TAR $CC_DOWNLOAD
		echo -n "
Unpacking ... "
		cd lib
		tar -xzf $CC_TAR compiler.jar
		if [ $? -ne 0 ]; then
			exit 1
		fi
		mv compiler.jar $CC_FILENAME
		if [ $? -ne 0 ]; then
			exit 1
		fi
		rm $CC_TAR
		echo "done"
		cd ..
	fi
}

check_jstd() {
	if [ ! -e lib/$JSTD_FILENAME ]; then
		echo "
Missing JsTestDriver - Downloading to lib/$JSTD_FILENAME
"
		download $JSTD_FILENAME $JSTD_DOWNLOAD
	fi
}

usage() {
	echo "Usage: build.sh [compile | test | ct | start | stop ]"
}

compile() {
	check_cc
	echo -n "Compiling hub-$HUB_VERSION.js ... "
	java -jar lib/$CC_FILENAME --compilation_level SIMPLE_OPTIMIZATIONS --js src/head.js --js src/iterator.js --js src/chain.js --js src/pubsub.js --js src/peer.js --js src/hub.js --js src/promise.js --js_output_file dist/hub-$HUB_VERSION.js --use_only_custom_externs
	if [ $? -ne 0 ]; then
		exit 1
	fi
	echo "OK"
}

test() {
	check_jstd
	find_server_process
	if [ ! "$MATCH" ]; then
		echo "
JsTestDriver server not running. Do this:
- ./build.sh start
- Open http://localhost:4224/capture
- ./build.sh test
"
		exit 1
	fi
	TEST_CASE="all"
	if [ $1 ]; then
		TEST_CASE="$1"
	fi
	java -jar lib/$JSTD_FILENAME --tests $TEST_CASE
	if [ $? -ne 0 ]; then
		exit 1
	fi
}

start() {
	check_jstd
	find_server_process
	if [ "$MATCH" ]; then
		echo "JsTestDriver server already running"
	else
		java -jar lib/$JSTD_FILENAME --port 4224 &
		if [ $? -ne 0 ]; then
			exit 1
		fi
	fi
}

find_server_process() {
	MATCH=`ps ax | grep -v grep | grep $JSTD_FILENAME`
}

stop() {
	find_server_process
	if [ "$MATCH" ]; then
		for PID in $MATCH; do
			kill $PID
			echo "Killed"
			break
		done
	else
		echo "JsTestDriver server not running"
	fi
}

# Check arguments:
if [ -z $1 ]; then
	usage
	exit 1
fi

THIS_DIR=`dirname $0`
cd $THIS_DIR

case "$1" in
	"compile" | "c" )
		compile
	;;
	"test" | "t" )
		test $2
	;;
	"ct" )
		compile
		test
	;;
	"start" )
		start
	;;
	"stop" )
		stop
	;;
	* )
		usage
		exit 1
esac
exit 0
