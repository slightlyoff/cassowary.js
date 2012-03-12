#!/bin/bash

# Use of this source code is governed by the LGPL, which can be found in the
# COPYING.LGPL file.
#
# Copyright (C) 2012, Alex Rusell (slightlyoff@chromium.org)

DOH='../util/doh/runner.js'
JSCPATH='/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Resources/jsc'
D8PATH=$(type -P d8)
JPATH=$(type -P java)
RUNNER=''

# FIXME(slightlyoff): Add option parsing to support explicit runtime selection.

if   [ $D8PATH ]  && [ -x $D8PATH ]; then
  RUNNER='d8 --harmony';
elif [ $JSCPATH ] && [ -x $JSCPATH ]; then
  RUNNER=$JSCPATH;
elif [ $JPATH ]   && [ -x $JPATH ]; then
  RUNNER='$JPATH -classpath ../util/js.jar org.mozilla.javascript.tools.shell.Main';
else
  echo "FAILED: No JavaScript Runtime Found! Please install Java or the V8 Shell (d8) and add them to your \$PATH"
  exit 1;
fi

echo "===================================================================="
echo "= Using runtime: $RUNNER"
echo "=-------------------------------------------------------------------"
echo "= Unit Tests"
echo "===================================================================="
echo ""
$RUNNER $DOH -- dohBase=../util/doh load=test.js

echo ""
echo "===================================================================="
echo "= Perf Tests"
echo "===================================================================="
echo ""
$RUNNER run-perf.js
