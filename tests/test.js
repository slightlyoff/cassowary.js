// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Copyright (C) 2012, Alex Rusell (slightlyoff@chromium.org)

load("../src/c.js");
load("../src/HashTable.js");
load("../src/HashSet.js");
load("../src/Error.js");
load("../src/SymbolicWeight.js");
load("../src/Strength.js");
load("../src/Variable.js");
load("../src/Point.js");
load("../src/LinearExpression.js");
load("../src/Constraint.js");
load("../src/LinearConstraint.js");
load("../src/EditInfo.js");
load("../src/Tableau.js");
load("../src/SimplexSolver.js");
load("../src/Timer.js");

/*
c.debug = false;
c.trace = false;
c.traceAdded = false;
c.verbose = false;
*/

load("LinearConstraint-test.js");
load("LinearExpression-test.js");
load("Point-test.js");
load("SimplexSolver-test.js");
load("Strength-test.js");
load("SymbolicWeight-test.js");
load("Tableau-test.js");
load("Variable-test.js");
