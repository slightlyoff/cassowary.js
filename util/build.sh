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
               ../src/LinearExpression.js\
               ../src/Constraint.js\
               ../src/LinearConstraint.js\
               ../src/EditInfo.js\
               ../src/Tableau.js\
               ../src/SimplexSolver.js\
               ../src/Timer.js > c.js
