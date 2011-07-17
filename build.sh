#!/bin/bash
#
# Copyright 2011, Maximilian Antoni
# Released under the MIT license:
# https://github.com/mantoni/hub.js/raw/master/LICENSE
#
# Build script for hub.js.
#
# Options:
# - compile | c: compile source files using Google Closure compiler
# - test | t: run test cases with JsTestDriver
# - ct: combined compile and test
# - lint: run JSLint
# - all: combined test, JSLint, compile and test of compiled version
# - start: start the JsTestDriver server
# - stop: stop the JsTestDriver server
#

# hub.js version to build:
HUB_VERSION="0.1-SNAPSHOT"

# Closure Compiler version:
CC_VERSION="20110119"

# JsTestDriver version:
JSTD_VERSION="1.3.2"

# Coverage version:
COVERAGE_VERSION=$JSTD_VERSION


CC_FILENAME="compiler-$CC_VERSION.jar"
CC_TAR="compiler-$CC_VERSION.tar.gz"
CC_DOWNLOAD="http://closure-compiler.googlecode.com/files/$CC_TAR"

JSTD_FILENAME="JsTestDriver-$JSTD_VERSION.jar"
JSTD_DOWNLOAD="http://js-test-driver.googlecode.com/files/$JSTD_FILENAME"
JSTD_CONFIG="jsTestDriver.conf"

COVERAGE_FILENAME="coverage-$COVERAGE_VERSION.jar"
COVERAGE_DOWNLOAD="http://js-test-driver.googlecode.com/files/$COVERAGE_FILENAME"
COVERAGE_CONFIG=".jstd-coverage.conf"

SOURCE_FILES="src/head.js src/util.js src/does.js src/iterator.js src/chain.js src/create.js src/node.js src/pubsub.js src/promise.js src/scope.js"

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

check_coverage() {
	check_jstd
	if [ ! -e lib/$COVERAGE_FILENAME ]; then
		echo "
Missing JsTestDriver Coverage Plugin - Downloading to lib/$COVERAGE_FILENAME
"
		download $COVERAGE_FILENAME $COVERAGE_DOWNLOAD
	fi
}

usage() {
	echo "Usage: build.sh [compile | test | ct | lint | all | start | stop ]"
}

lint() {
	echo -n "Running JSLint checks ... "
	LINT_OK=0
	LINT_OPT="--node false"
	TESTS_HUB=`ls test/hub/*.js`
	TESTS_PATTERNS=`ls test/patterns/*.js`
	FILES="${SOURCE_FILES} $TESTS_HUB $TESTS_PATTERNS"
	for FILE in $FILES
	do
		LINT_RESULT=`jslint $LINT_OPT $FILE | sed -n -e '4,100p'`
		if [ "$LINT_RESULT" != "No errors found." ]; then
			echo
			echo $FILE
			echo "$LINT_RESULT"
			LINT_OK=1
		fi
	done
	if [ $LINT_OK -eq 0 ]; then
		echo "OK"
	else
		echo
	fi
}

compile() {
	check_cc
	echo -n "Compiling hub-$HUB_VERSION.js ... "
	cat $SOURCE_FILES | sed "s/{version}/$HUB_VERSION/g" > dist/hub.js
	java -jar lib/$CC_FILENAME --compilation_level SIMPLE_OPTIMIZATIONS --js dist/hub.js --js_output_file dist/hub-$HUB_VERSION.js --use_only_custom_externs
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
	java -jar lib/$JSTD_FILENAME --config $JSTD_CONFIG --tests $TEST_CASE
	if [ $? -ne 0 ]; then
		exit 1
	fi
}

coverage() {
	#
	# TODO JSTD runner is automatically reset if new config file is specified,
	# but still coverage does not work. Server needs to be started with the
	# plugin configuration in place.
	#
	# The need for all this would go away with resolution of issue 75:
	# http://code.google.com/p/js-test-driver/issues/detail?id=75
	#
	check_coverage
	cp $JSTD_CONFIG $COVERAGE_CONFIG
	echo "
plugin:
  - name: \"coverage\"
    jar: \"lib/$COVERAGE_FILENAME\"
    module: \"com.google.jstestdriver.coverage.CoverageModule\"
" >> $COVERAGE_CONFIG
	cp dist/hub-$HUB_VERSION.js dist/hub.js
	JSTD_CONFIG="$COVERAGE_CONFIG"
	test
	rm "$COVERAGE_CONFIG"
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
	"lint" | "l" )
		lint
	;;
	"ct" )
		test
		compile
	;;
	"coverage" )
		coverage
	;;
	"all" | "a" )
		test # should be coverage, but does not work as expected.
		if [ ! -z `type -P jslint` ]; then
			lint
		fi
		compile
		cp dist/hub-$HUB_VERSION.js dist/hub.js
		JSTD_CONFIG="jsTestDriverDist.conf"
		test # run tests on dist/hub.js again
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
