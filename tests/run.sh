#!/bin/bash

DOH='../util/doh/runner.js'
RUNNER=''

if [ -x `which d8` ]
then
  RUNNER=d8 
else
  RUNNER='java -classpath ../util/js.jar org.mozilla.javascript.tools.shell.Main'
fi

$RUNNER $DOH -- dohBase=../util/doh load=test.js
