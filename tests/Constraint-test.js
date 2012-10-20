// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.Constraint", [
  function equationFromExpression(t) {
    var ex = new c.Expression(10);
    var c1 = new c.Equation(ex);
    t.is(c1.expression, ex);
  },

  function expressionFromVars(t) {
    var x = new c.Variable(167);
    var y = new c.Variable(2);
    var cly = new c.Expression(y);
    cly.addExpression(x);
  },

  function equationFromVarAndExpression(t) {
    var x = new c.Variable('x', 167);
    var cly = new c.Expression(2);
    var eq = new c.Equation(x, cly);
    t.t(eq.expression.equals(cly.minus(x)));
  },

  function equationStrengthTest(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x", 10);
    var y = new c.Variable("y", 20);
    var z = new c.Variable("z", 1);
    var w = new c.Variable("w", 1);

    // Default weights.
    var e0 = new c.Equation(x, y);
    solver.addStay(y);
    solver.addConstraint(e0);
    t.t(c.approx(x, 20));
    t.t(c.approx(y, 20));

    // Weak.
    var e1 = new c.Equation(x, z, c.Strength.weak);
    solver.addStay(x);
    solver.addConstraint(e1);
    t.t(c.approx(x, 20));
    t.t(c.approx(z, 20));
    return;

    // Strong.
    var e2 = new c.Equation(z, w, c.Strength.strong);
    solver.addStay(w);
    solver.addConstraint(e2);
    t.is(w.value, 1);
    t.is(z.value, 1);
  },

  function equation_variable_number(t) {
    var v = new c.Variable('v', 22);
    var eq = new c.Equation(v, 5);
    t.t(eq.expression.equals(c.Minus(5, v)));
  },

  function equation_expression_variable(t) {
    var e = new c.Expression(10);
    var v = new c.Variable('v', 22);
    var eq = new c.Equation(e, v);

    t.t(eq.expression.equals(c.Minus(10, v)));
  },

  function equation_expression_x2(t) {
    var e1 = new c.Expression(10);
    var e2 = new c.Expression(new c.Variable('z', 10), 2, 4);
    var eq = new c.Equation(e1, e2);

    t.t(eq.expression.equals(e1.minus(e2)));
  },

  function inequality_expression(t) {
    var e = new c.Expression(10);
    var ieq = new c.Inequality(e);

    t.is(ieq.expression, e);
  },

  function inequality_var_op_var(t) {
    var v1 = new c.Variable('v1', 10);
    var v2 = new c.Variable('v2', 5);
    var ieq = new c.Inequality(v1, c.GEQ, v2);

    t.t(ieq.expression.equals(c.Minus(v1, v2)));

    ieq = new c.Inequality(v1, c.LEQ, v2);
    t.t(ieq.expression.equals(c.Minus(v2, v1)));
  },

  function inequality_var_op_num(t) {
    var v = new c.Variable('v', 10);
    var ieq = new c.Inequality(v, c.GEQ, 5);

    t.t(ieq.expression.equals(c.Minus(v, 5)));

    ieq = new c.Inequality(v, c.LEQ, 5);
    t.t(ieq.expression.equals(c.Minus(5, v)));
  },

  function inequality_expression_x2(t) {
    var e1 = new c.Expression(10);
    var e2 = new c.Expression(new c.Variable('c', 10), 2, 4);
    var ieq = new c.Inequality(e1, c.GEQ, e2);

    t.t(ieq.expression.equals(e1.minus(e2)));

    ieq = new c.Inequality(e1, c.LEQ, e2);
    t.t(ieq.expression.equals(e2.minus(e1)));
  },

  function inequality_var_op_exp(t) {
    var v = new c.Variable('v', 10);
    var e = new c.Expression(new c.Variable('x', 5), 2, 4);
    var ieq = new c.Inequality(v, c.GEQ, e);

    t.t(ieq.expression.equals(c.Minus(v, e)));

    ieq = new c.Inequality(v, c.LEQ, e);
    t.t(ieq.expression.equals(e.minus(v)));
  },

  function inequality_exp_op_var(t) {
    var v = new c.Variable('v', 10);
    var e = new c.Expression(new c.Variable('x', 5), 2, 4);
    var ieq = new c.Inequality(e, c.GEQ, v);

    t.t(ieq.expression.equals(e.minus(v)));

    ieq = new c.Inequality(e, c.LEQ, v);
    t.t(ieq.expression.equals(c.Minus(v, e)));
  }
]);
