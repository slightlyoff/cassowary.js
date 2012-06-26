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
    var w = new c.Variable("w", 1);
    
    // Default weights.
    var e0 = new c.LinearEquation(x, y);
    solver.addStay(y);
    solver.addConstraint(e0);
    t.t(c.approx(x, 20));
    t.t(c.approx(y, 20));

    // Weak.
    var e1 = new c.LinearEquation(x, z, c.Strength.weak);
    solver.addStay(x);
    solver.addConstraint(e1);
    t.t(c.approx(x, 20));
    t.t(c.approx(z, 20));
    return;

    // Strong.
    var e2 = new c.LinearEquation(z, w, c.Strength.strong);
    solver.addStay(w);
    solver.addConstraint(e2);
    t.is(w.value(), 1);
    t.is(z.value(), 1);
  }
]);
