// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.LinearConstraint", [
  function equationFromExpression(t) {
    var ex = new c.LinearExpression();
    var c1 = new c.LinearEquation(ex);
  },

  function expressionFromVars(t) {
    var x = new c.Variable(167);
    var y = new c.Variable(2);
    var cly = new c.LinearExpression(y);
    cly.addExpression(x);
  },

  function equationFromExpressionAndVar(t) {
    var x = new c.Variable(167);
    var y = new c.Variable(2);
    var cly = new c.LinearExpression(y);
    var eq = new c.LinearEquation(x, cly);
  },

  function equationStrengthTest(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x", 10);
    var y = new c.Variable("y", 20);
    var z = new c.Variable("z", 1);
    var e0 = new c.LinearEquation(x, y);
    solver.addStay(x)
          .addStay(y);
    solver.addConstraint(e0);
    print("x: " + x.value());
    print("y: " + y.value());

    var e1 = new c.LinearEquation(x, y, c.Strength.weak);
    solver.addConstraint(e1);
    print("x: " + x.value());
    print("y: " + y.value());

    // var leq = new c.LinearInequality(a, c.LEQ, b, c.Strength.strong);
    // print(a.value());
    // print(b.value());
    // t.is(a.value(
  }
]);
