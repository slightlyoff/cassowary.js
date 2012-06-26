#!/bin/bash

# Use of this source code is governed by the LGPL, which can be found in the
# COPYING.LGPL file.
#
# Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

D8PATH=$(type -P d8)
D8DIR=''

if   [ $D8PATH ]  && [ -x $D8PATH ]; then
  D8DIR=$(dirname ${D8PATH})
else
  echo "FAILED: No d8/v8 directory found! Please add v8_edge to your \$PATH and build d8"
  exit 1;
fi

rm -rf v8.log
rm -rf test.prof

$D8PATH --harmony --prof ../tests/run-perf.js
$D8DIR/tools/mac-tick-processor v8.log > test.prof
