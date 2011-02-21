#!/bin/bash
#
# Copyright (c) 2011 Maximilian Antoni
#
# Generates a test.sh script that runs all test cases using JsTestDriver.
# The script requires Maven with the dependency plugin and the JsTestDriver
# JAR must be installed in the Maven repository.
#
echo "Searching for JsTestDriver (might take a while) ..."
THIS_DIR=`dirname $0`
cd $THIS_DIR/..
PROJECT_DIR=`pwd`
JAR_FILE=`mvn dependency:build-classpath -DincludeArtifactIds=jstestdriver | fgrep -A 1 "[INFO] Dependencies classpath:" | fgrep -v "[INFO] Dependencies classpath:"`
TEST_SCRIPT="$THIS_DIR/test.sh"
JSTD_CONFIG="target/test-config/src.conf"
echo "#!/bin/bash
cd $PROJECT_DIR
if [ ! -e $JSTD_CONFIG ]; then
	mvn resources:testResources
fi
java -classpath $JAR_FILE com.google.jstestdriver.JsTestDriver --tests all --config $JSTD_CONFIG
" > $TEST_SCRIPT
chmod +x $TEST_SCRIPT
echo "Done.
"
