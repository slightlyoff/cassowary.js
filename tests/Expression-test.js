// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.Expression", [
  function threeVarCtor(t) {
    var x = new c.Variable("x", 167);
    var e = new c.Expression(x, 2, 3);
    t.is(e, "3 + 2*[x:167]");
  },

  function oneParamCtor(t) {
    t.is(new c.Expression(4), "4");
  },

  function plus(t) {
    var x = new c.Variable("x", 167);
    t.is(c.Plus(4,2), "6");
    t.is(c.Plus(x,2), "2 + 1*[x:167]");
    t.is(c.Plus(3,x), "3 + 1*[x:167]");
  },

  function plus_solve(t) {
    var s = new c.SimplexSolver();
    var x = new c.Variable("x", 167);
    t.is(c.Plus(4,2), "6");
    t.is(c.Plus(x,2), "2 + 1*[x:167]");
    t.is(c.Plus(3,x), "3 + 1*[x:167]");
  },

  function times(t) {
    var x = new c.Variable("x", 167);
    t.is(c.Times(x,3), "3*[x:167]");
    t.is(c.Times(7,x), "7*[x:167]");
  },

  function complex(t) {
    var x = new c.Variable("x", 167);
    var y = new c.Variable("y", 2);
    var ex = c.Plus(4, c.Plus(c.Times(x,3), c.Times(2,y)));
    t.is(ex, "4 + 3*[x:167] + 2*[y:2]");
  },
  
  function zero_args(t) {
    var exp = new c.Expression;
    t.is(0, exp.constant);
    t.is(0, exp.terms.size());
  },
  
  function one_number(t) {
    var exp = new c.Expression(10);
    t.is(10, exp.constant);
    t.is(0, exp.terms.size());
  },
  
  function one_variable(t) {
    var v = new c.Variable(10);
    var exp = new c.Expression(v);
    t.is(0, exp.constant);
    t.is(1, exp.terms.size());
    t.is(1, exp.terms.get(v));
  },
  
  function variable_number(t) {
    var v = new c.Variable(10);
    var exp = new c.Expression(v, 20);
    t.is(0, exp.constant);
    t.is(1, exp.terms.size());
    t.is(20, exp.terms.get(v));
  },
  
  function variable_number_number(t) {
    var v = new c.Variable(10);
    var exp = new c.Expression(v, 20, 2);
    t.is(2, exp.constant);
    t.is(1, exp.terms.size());
    t.is(20, exp.terms.get(v));
  },
  
  function clone(t) {
    var v = new c.Variable(10);
    var exp = new c.Expression(v, 20, 2);
    var clone = exp.clone();
    
    t.is(clone.constant, exp.constant);
    t.is(clone.terms.size(), exp.terms.size());
    t.is(20, clone.terms.get(v));
  },
  
  function isConstant(t) {
    var e1 = new c.Expression;
    var e2 = new c.Expression(10);
    var e3 = new c.Expression(new c.Variable(10), 20, 2);
    
    t.is(true, e1.isConstant());
    t.is(true, e2.isConstant());
    t.is(false, e3.isConstant());
  },
  
  function multiplyMe(t) {
    var v = new c.Variable(10);
    var e = new c.Expression(v, 20, 2).multiplyMe(-1);

    t.is(e.constant, -2);
    t.is(v.value(), 10);
    t.is(e.terms.get(v), -20);
  },
  
  function times(t) {
    var v = new c.Variable(10);
    var a = new c.Expression(v, 20, 2);

    // times a number
    var e = a.times(10);
    t.is(e.constant, 20);
    t.is(e.terms.get(v), 200);

    // times a constant exression
    var e = a.times(new c.Expression(10))
    t.is(e.constant, 20);
    t.is(e.terms.get(v), 200);

    // constant expression times another expression
    var e = new c.Expression(10).times(a)
    t.is(e.constant, 20);
    t.is(e.terms.get(v), 200);

    // multiplying two non-constant expressions
    t.e(c.NonExpression, a, 'times', [a]);
  },
  
  function addVariable(t) {
    var a = new c.Expression(new c.Variable(10), 20, 2);
    var v = new c.Variable(20);

    // implicit coefficient of 1
    a.addVariable(v);
    t.is(a.terms.size(), 2);
    t.is(a.terms.get(v), 1);

    // add again, with different coefficient
    a.addVariable(v, 2);
    t.is(a.terms.size(), 2);
    t.is(a.terms.get(v), 3);

    // add again, with resulting 0 coefficient. should remove the term.
    a.addVariable(v, -3);
    t.is(a.terms.size(), 1);
    t.is(null, a.terms.get(v));

    // try adding the removed term back, with 0 coefficient
    a.addVariable(v, 0);
    t.is(a.terms.size(), 1);
    t.is(null, a.terms.get(v));
  },
  
  function addExpression_variable(t) {
    var a = new c.Expression(new c.Variable(10), 20, 2);
    var v = new c.Variable(20);

    // should work just like addVariable
    a.addExpression(v, 2);
    t.is(a.terms.size(), 2);
    t.is(a.terms.get(v), 2);
  },
  
  function addExpression(t) {
    var va = new c.Variable(10);
    var vb = new c.Variable(20);
    var vc = new c.Variable(5);
    var a = new c.Expression(va, 20, 2);

    // different variable and implicit coefficient of 1, should make new term
    a.addExpression(new c.Expression(vb, 10, 5));
    t.is(a.terms.size(), 2);
    t.is(a.constant, 7);
    t.is(a.terms.get(vb), 10);

    // same variable, should reuse existing term
    a.addExpression(new c.Expression(vb, 2, 5));
    t.is(a.terms.size(), 2);
    t.is(a.constant, 12);
    t.is(a.terms.get(vb), 12);
    
    // another variable and a coefficient, 
    // should multiply the constant and all terms in the new expression
    a.addExpression(new c.Expression(vc, 1, 2), 2);
    t.is(a.terms.size(), 3);
    t.is(a.constant, 16);
    t.is(a.terms.get(vc), 2);
  },
  
  function plus(t) {
    var va = new c.Variable(10);
    var vb = new c.Variable(20);
    var a = new c.Expression(va, 20, 2);
    var b = new c.Expression(vb, 10, 5);
    
    var p = a.plus(b);
    t.assertNotEqual(a, p);
    t.assertNotEqual(a, b);

    t.is(p.constant, 7);
    t.is(p.terms.size(), 2);
    t.is(p.terms.get(va), 20);
    t.is(p.terms.get(vb), 10);
  },
  
  function minus(t) {
    var va = new c.Variable(10);
    var vb = new c.Variable(20);
    var a = new c.Expression(va, 20, 2);
    var b = new c.Expression(vb, 10, 5);
    
    var p = a.minus(b);
    t.assertNotEqual(a, p);
    t.assertNotEqual(a, b);

    t.is(p.constant, -3);
    t.is(p.terms.size(), 2);
    t.is(p.terms.get(va), 20);
    t.is(p.terms.get(vb), -10);
  },
  
  function divide(t) {
    var va = new c.Variable(10);
    var vb = new c.Variable(20);
    var a = new c.Expression(va, 20, 2);
    
    t.e(c.NonExpression, a, 'divide', [0]);
    
    var p = a.divide(2);
    t.is(p.constant, 1);
    t.is(p.terms.get(va), 10);
    
    t.e(c.NonExpression, a, 'divide', [new c.Expression(vb, 10, 5)]);
    t.e(c.NonExpression, new c.Expression(vb, 10, 5), 'divide', [a]);
    
    p = a.divide(new c.Expression(2));
    t.is(p.constant, 1);
    t.is(p.terms.get(va), 10);
  },
  
  function coefficientFor(t) {
    var va = new c.Variable(10);
    var vb = new c.Variable(20);
    var a = new c.Expression(va, 20, 2);
    
    t.is(a.coefficientFor(va), 20);
    t.is(a.coefficientFor(vb), 0);
  },
  
  function setVariable(t) {
    var va = new c.Variable(10);
    var vb = new c.Variable(20);
    var a = new c.Expression(va, 20, 2);
    
    // set existing variable
    a.setVariable(va, 2);
    t.is(a.terms.size(), 1);
    t.is(a.coefficientFor(va), 2);
    
    // set new variable
    a.setVariable(vb, 2);
    t.is(a.terms.size(), 2);
    t.is(a.coefficientFor(vb), 2);
  },
  
  function anyPivotableVariable(t) {
    t.e(c.InternalError, new c.Expression(10), 'anyPivotableVariable');
    
    var va = new c.Variable(10);
    var vb = new c.SlackVariable;
    var a = new c.Expression(va, 20, 2);
    
    t.is(null, a.anyPivotableVariable());
    
    a.setVariable(vb, 2);
    t.is(vb, a.anyPivotableVariable());
  },
  
  function substituteOut(t) {
    var v1 = new c.Variable(20);
    var v2 = new c.Variable(2);
    var a = new c.Expression(v1, 2, 2); // 2*v1 + 2
    
    // new variable
    a.substituteOut(v1, new c.Expression(v2, 4, 4));
    t.is(a.constant, 10);
    t.is(null, a.terms.get(v1));
    t.is(a.terms.get(v2), 8);
    
    // existing variable
    a.setVariable(v1, 1);
    a.substituteOut(v2, new c.Expression(v1, 2, 2));

    t.is(a.constant, 26);
    t.is(null, a.terms.get(v2));
    t.is(a.terms.get(v1), 17);
  },
  
  function newSubject(t) {
    var v = new c.Variable(10);
    var e = new c.Expression(v, 2, 5);

    t.is(e.newSubject(v), 1 / 2);
    t.is(e.constant, -2.5);
    t.is(null, e.terms.get(v));
    t.is(true, e.isConstant());
  },
  
  function changeSubject(t) {
    var va = new c.Variable(10);
    var vb = new c.Variable(5);
    var e = new c.Expression(va, 2, 5);

    e.changeSubject(vb, va);
    t.is(e.constant, -2.5);
    t.is(null, e.terms.get(va));
    t.is(e.terms.get(vb), 0.5);
  },
  
  function toString(t) {
    var v = new c.Variable('v', 5);

    t.is(new c.Expression(10).toString(), '10');
    t.is(new c.Expression(v, 0, 10).toString(), '10 + 0*[v:5]');

    var e = new c.Expression(v, 2, 10);
    t.is(e.toString(), '10 + 2*[v:5]');

    e.setVariable(new c.Variable('b', 2), 4);
    t.is(e.toString(), '10 + 2*[v:5] + 4*[b:2]');
  },
  
  function Plus(t) {
    var x = new c.Variable('x', 167);
    var y = new c.Variable('y', 10);

    t.is(c.Plus(2, 3), '5');
    t.is(c.Plus(x, 2), '2 + 1*[x:167]');
    t.is(c.Plus(3, x), '3 + 1*[x:167]');
    t.is(c.Plus(x, y), '1*[x:167] + 1*[y:10]');
  },
  
  function Minus(t) {
    var x = new c.Variable('x', 167);
    var y = new c.Variable('y', 10);

    t.is(c.Minus(2, 3), '-1');
    t.is(c.Minus(x, 2), '-2 + 1*[x:167]');
    t.is(c.Minus(3, x), '3 + -1*[x:167]');
    t.is(c.Minus(x, y), '1*[x:167] + -1*[y:10]');
  },
  
  function Times(t) {
    var x = new c.Variable('x', 167);
    var y = new c.Variable('y', 10);

    t.is(c.Times(2, 3), '6');
    t.is(c.Times(x, 2), '2*[x:167]');
    t.is(c.Times(3, x), '3*[x:167]');
    t.e(c.NonExpression, c, 'Times', [x, y]);
  },
  
  function Divide(t) {
    var x = new c.Variable('x', 167);
    var y = new c.Variable('y', 10);

    t.is(c.Divide(4, 2), '2');
    t.is(c.Divide(x, 2), '0.5*[x:167]');
    t.e(c.NonExpression, c, 'Divide', [4, x]);
    t.e(c.NonExpression, c, 'Divide', [x, y]);
  }
]);