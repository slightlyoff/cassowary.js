// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.LinearConstraint", [
  // FIXME(slightlyoff): these tests are STUPID. FIXME>

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
]);
