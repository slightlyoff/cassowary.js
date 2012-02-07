#!/bin/bash

DOH='../util/doh/runner.js'
JSCPATH='/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Resources/jsc'
D8PATH=`which d8`
RUNNER=''

# FIXME(slightlyoff): Add option parsing to support explicit runtime selection.

if [ -x $D8PATH ]
then
  RUNNER='d8 --harmony'
elif [ -x $JSCPATH ]
then
  RUNNER=$JSCPATH
elif [ -x `which java` ]
  RUNNER='java -classpath ../util/js.jar org.mozilla.javascript.tools.shell.Main'
else
  echo "FAILED: No JavaScript Runtime Found! Please install Java or the V8 Shell (d8) and add them to your \$PATH"
  exit 1;
fi

echo ""
echo "===================================================================="
echo "= Smoke Tests"
echo "===================================================================="
echo ""
$RUNNER run-smoke-tests.js
echo ""
echo "===================================================================="
echo "= Unit Tests"
echo "===================================================================="
echo ""
$RUNNER $DOH -- dohBase=../util/doh load=test.js
