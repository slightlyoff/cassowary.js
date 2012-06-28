// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.LinearConstraint", [
  function equationFromExpression(t) {
    var ex = new c.LinearExpression(10);
    var c1 = new c.LinearEquation(ex);
    t.is(c1.expression, '10');
  },

  function expressionFromVars(t) {
    var x = new c.Variable(167);
    var y = new c.Variable(2);
    var cly = new c.LinearExpression(y);
    cly.addExpression(x);
  },

  function equationFromVarAndExpression(t) {
    var x = new c.Variable('x', 167);
    var cly = new c.LinearExpression(2);
    var eq = new c.LinearEquation(x, cly);
    t.is('2 + -1*[x:167]', eq.expression);
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
  },
  
  function equation_variable_number(t) {
    var v = new c.Variable('v', 22);
    var eq = new c.LinearEquation(v, 5);
    t.is(eq.expression, '5 + -1*[v:22]');
  },
  
  function equation_expression_variable(t) {
    var e = new c.LinearExpression(10);
    var v = new c.Variable('v', 22);
    var eq = new c.LinearEquation(e, v);

    t.is(eq.expression, '10 + -1*[v:22]');
  },
  
  function equation_expression_x2(t) {
    var e1 = new c.LinearExpression(10);
    var e2 = new c.LinearExpression(new c.Variable('z', 10), 2, 4);
    var eq = new c.LinearEquation(e1, e2);

    t.is(eq.expression, '6 + -2*[z:10]');
  },
  
  function inequality_expression(t) {
    var e = new c.LinearExpression(10);
    var ieq = new c.LinearInequality(e);

    t.is(ieq.expression, '10');
  },
  
  function inequality_var_op_var(t) {
    var v1 = new c.Variable('v1', 10);
    var v2 = new c.Variable('v2', 5);
    var ieq = new c.LinearInequality(v1, c.GEQ, v2);

    t.is(ieq.expression, '-1*[v2:5] + 1*[v1:10]');
    
    ieq = new c.LinearInequality(v1, c.LEQ, v2);
    t.is(ieq.expression, '1*[v2:5] + -1*[v1:10]');
  },
  
  function inequality_var_op_num(t) {
    var v = new c.Variable('v', 10);
    var ieq = new c.LinearInequality(v, c.GEQ, 5);

    t.is(ieq.expression, '-5 + 1*[v:10]');
    
    ieq = new c.LinearInequality(v, c.LEQ, 5);
    t.is(ieq.expression, '5 + -1*[v:10]');
  },
  
  function inequality_expression_x2(t) {
    var e1 = new c.LinearExpression(10);
    var e2 = new c.LinearExpression(new c.Variable('c', 10), 2, 4);
    var ieq = new c.LinearInequality(e1, c.GEQ, e2);

    t.is(ieq.expression, '6 + -2*[c:10]');
    
    ieq = new c.LinearInequality(e1, c.LEQ, e2);
    t.is(ieq.expression, '-6 + 2*[c:10]');
  },
  
  function inequality_var_op_exp(t) {
    var v = new c.Variable('v', 10);
    var e = new c.LinearExpression(new c.Variable('x', 5), 2, 4);
    var ieq = new c.LinearInequality(v, c.GEQ, e);

    t.is(ieq.expression, '-4 + -2*[x:5] + 1*[v:10]');

    ieq = new c.LinearInequality(v, c.LEQ, e);
    t.is(ieq.expression, '4 + 2*[x:5] + -1*[v:10]');
  },
  
  function inequality_exp_op_var(t) {
    var v = new c.Variable('v', 10);
    var e = new c.LinearExpression(new c.Variable('x', 5), 2, 4);
    var ieq = new c.LinearInequality(e, c.GEQ, v);

    t.is(ieq.expression, '4 + 2*[x:5] + -1*[v:10]');

    ieq = new c.LinearInequality(e, c.LEQ, v);
    t.is(ieq.expression, '-4 + -2*[x:5] + 1*[v:10]');
  }
]);
