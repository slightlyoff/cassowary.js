#!/bin/bash

# Use of this source code is governed by the LGPL, which can be found in the
# COPYING.LGPL file.
#
# Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

# Run it through uglify.
python post.py ../src/c.js\
               ../src/HashTable.js\
               ../src/HashSet.js\
               ../src/Error.js\
               ../src/SymbolicWeight.js\
               ../src/Strength.js\
               ../src/Variable.js\
               ../src/Point.js\
               ../src/Expression.js\
               ../src/Constraint.js\
               ../src/EditInfo.js\
               ../src/Tableau.js\
               ../src/SimplexSolver.js\
               ../src/Timer.js\
               ../src/parser/parser.js > out.js

cat preamble.js out.js afterward.js > ../bin/c.js

rm out.js
