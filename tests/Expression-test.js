// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

(function() {

"use strict";

var c = require("../");
var t = require("chai").assert;
t.is = t.deepEqual;
t.t = t;
t.f = function(obj, str) {
  return t.t(!obj, str);
};

describe("c.Expression", function() {
  it("is constructable with 3 variables as arguments", function () {
    var x = new c.Variable({ name: "x", value: 167 });
    var e = new c.Expression(x, 2, 3);
    t.is(e.toString(), "3 + 2*[x:167]");
  });

  it("is constructable with one parameter", function() {
    t.is(new c.Expression(4).toString(), "4");
  });

  it("plus", function() {
    var x = new c.Variable({ name: "x", value: 167 });
    t.is(c.plus(4,2).toString(), "6");
    t.is(c.plus(x,2).toString(), "2 + 1*[x:167]");
    t.is(c.plus(3,x).toString(), "3 + 1*[x:167]");
  });

  it("plus_solve", function() {
    var s = new c.SimplexSolver();
    var x = new c.Variable({ name: "x", value: 167 });
    t.is(c.plus(4,2).toString(), "6");
    t.is(c.plus(x,2).toString(), "2 + 1*[x:167]");
    t.is(c.plus(3,x).toString(), "3 + 1*[x:167]");
  });

  it("times", function() {
    var x = new c.Variable({ name: "x", value: 167 });
    t.is(c.times(x,3).toString(), "3*[x:167]");
    t.is(c.times(7,x).toString(), "7*[x:167]");
  });

  it("complex", function() {
    var x = new c.Variable({ name: "x", value: 167 });
    var y = new c.Variable({ name: "y", value: 2 });
    var ex = c.plus(4, c.plus(c.times(x,3), c.times(2,y)));
    t.is(ex.toString(), "4 + 3*[x:167] + 2*[y:2]");
  });

  it("zero_args", function() {
    var exp = new c.Expression;
    t.is(0, exp.constant);
    t.is(0, exp.terms.size);
  });

  it("one_number", function() {
    var exp = new c.Expression(10);
    t.is(10, exp.constant);
    t.is(0, exp.terms.size);
  });

  it("one_variable", function() {
    var v = new c.Variable({ value: 10 });
    var exp = new c.Expression(v);
    t.is(0, exp.constant);
    t.is(1, exp.terms.size);
    t.is(1, exp.terms.get(v));
  });

  it("variable_number", function() {
    var v = new c.Variable({ value: 10 });
    var exp = new c.Expression(v, 20);
    t.is(0, exp.constant);
    t.is(1, exp.terms.size);
    t.is(20, exp.terms.get(v));
  });

  it("variable_number_number", function() {
    var v = new c.Variable({ value: 10 });
    var exp = new c.Expression(v, 20, 2);
    t.is(2, exp.constant);
    t.is(1, exp.terms.size);
    t.is(20, exp.terms.get(v));
  });

  it("clone", function() {
    var v = new c.Variable({ value: 10 });
    var exp = new c.Expression(v, 20, 2);
    var clone = exp.clone();

    t.is(clone.constant, exp.constant);
    t.is(clone.terms.size, exp.terms.size);
    t.is(20, clone.terms.get(v));
  });

  it("isConstant", function() {
    var e1 = new c.Expression;
    var e2 = new c.Expression(10);
    var e3 = new c.Expression(new c.Variable({ value: 10 }), 20, 2);

    t.is(true, e1.isConstant);
    t.is(true, e2.isConstant);
    t.is(false, e3.isConstant);
  });

  it("multiplyMe", function() {
    var v = new c.Variable({ value: 10 });
    var e = new c.Expression(v, 20, 2).multiplyMe(-1);

    t.is(e.constant, -2);
    t.is(v.value, 10);
    t.is(e.terms.get(v), -20);
  });

  it("times", function() {
    var v = new c.Variable({ value: 10 });
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
    // t.e(c.NonExpression, a, 'times', [a]);
    t.throws(a.times.bind(a, a), c.NonExpression);
  });

  it("addVariable", function() {
    var a = new c.Expression(new c.Variable({ value: 10 }), 20, 2);
    var v = new c.Variable({ value: 20 });

    // implicit coefficient of 1
    a.addVariable(v);
    t.is(a.terms.size, 2);
    t.is(a.terms.get(v), 1);

    // add again, with different coefficient
    a.addVariable(v, 2);
    t.is(a.terms.size, 2);
    t.is(a.terms.get(v), 3);

    // add again, with resulting 0 coefficient. should remove the term.
    a.addVariable(v, -3);
    t.is(a.terms.size, 1);
    t.is(null, a.terms.get(v));

    // try adding the removed term back, with 0 coefficient
    a.addVariable(v, 0);
    t.is(a.terms.size, 1);
    t.is(null, a.terms.get(v));
  });

  it("addExpression_variable", function() {
    var a = new c.Expression(new c.Variable({ value: 10 }), 20, 2);
    var v = new c.Variable({ value: 20 });

    // should work just like addVariable
    a.addExpression(v, 2);
    t.is(a.terms.size, 2);
    t.is(a.terms.get(v), 2);
  });

  it("addExpression", function() {
    var va = new c.Variable({ value: 10 });
    var vb = new c.Variable({ value: 20 });
    var vc = new c.Variable({ value: 5 });
    var a = new c.Expression(va, 20, 2);

    // different variable and implicit coefficient of 1, should make new term
    a.addExpression(new c.Expression(vb, 10, 5));
    t.is(a.terms.size, 2);
    t.is(a.constant, 7);
    t.is(a.terms.get(vb), 10);

    // same variable, should reuse existing term
    a.addExpression(new c.Expression(vb, 2, 5));
    t.is(a.terms.size, 2);
    t.is(a.constant, 12);
    t.is(a.terms.get(vb), 12);

    // another variable and a coefficient,
    // should multiply the constant and all terms in the new expression
    a.addExpression(new c.Expression(vc, 1, 2), 2);
    t.is(a.terms.size, 3);
    t.is(a.constant, 16);
    t.is(a.terms.get(vc), 2);
  });

  it("plus", function() {
    var va = new c.Variable({ value: 10 });
    var vb = new c.Variable({ value: 20 });
    var a = new c.Expression(va, 20, 2);
    var b = new c.Expression(vb, 10, 5);

    var p = a.plus(b);
    t.notDeepEqual(a, p);
    t.notDeepEqual(a, b);

    t.is(p.constant, 7);
    t.is(p.terms.size, 2);
    t.is(p.terms.get(va), 20);
    t.is(p.terms.get(vb), 10);
  });

  it("minus", function() {
    var va = new c.Variable({ value: 10 });
    var vb = new c.Variable({ value: 20 });
    var a = new c.Expression(va, 20, 2);
    var b = new c.Expression(vb, 10, 5);

    var p = a.minus(b);
    t.notDeepEqual(a, p);
    t.notDeepEqual(a, b);

    t.is(p.constant, -3);
    t.is(p.terms.size, 2);
    t.is(p.terms.get(va), 20);
    t.is(p.terms.get(vb), -10);
  });

  it("divide", function() {
    var va = new c.Variable({ value: 10 });
    var vb = new c.Variable({ value: 20 });
    var a = new c.Expression(va, 20, 2);

    t.throws(a.divide.bind(a, 0), c.NonExpression);
    // t.e(c.NonExpression, a, 'divide', [0]);

    var p = a.divide(2);
    t.is(p.constant, 1);
    t.is(p.terms.get(va), 10);

    t.throws(a.divide.bind(a, new c.Expression(vb, 10, 5)),
             c.NonExpression);
    // t.e(c.NonExpression, a, 'divide', [new c.Expression(vb, 10, 5)]);
    var ne = new c.Expression(vb, 10, 5);
    t.throws(ne.divide.bind(ne, a), c.NonExpression);

    p = a.divide(new c.Expression(2));
    t.is(p.constant, 1);
    t.is(p.terms.get(va), 10);
  });

  it("coefficientFor", function() {
    var va = new c.Variable({ value: 10 });
    var vb = new c.Variable({ value: 20 });
    var a = new c.Expression(va, 20, 2);

    t.is(a.coefficientFor(va), 20);
    t.is(a.coefficientFor(vb), 0);
  });

  it("setVariable", function() {
    var va = new c.Variable({ value: 10 });
    var vb = new c.Variable({ value: 20 });
    var a = new c.Expression(va, 20, 2);

    // set existing variable
    a.setVariable(va, 2);
    t.is(a.terms.size, 1);
    t.is(a.coefficientFor(va), 2);

    // set new variable
    a.setVariable(vb, 2);
    t.is(a.terms.size, 2);
    t.is(a.coefficientFor(vb), 2);
  });

  it("anyPivotableVariable", function() {

    // t.e(c.InternalError, new c.Expression(10), 'anyPivotableVariable');
    var e = new c.Expression(10);
    t.throws(e.anyPivotableVariable.bind(e), c.InternalError);
    // t.e(c.InternalError, new c.Expression(10), 'anyPivotableVariable');

    var va = new c.Variable({ value: 10 });
    var vb = new c.SlackVariable;
    var a = new c.Expression(va, 20, 2);

    t.is(null, a.anyPivotableVariable());

    a.setVariable(vb, 2);
    t.is(vb, a.anyPivotableVariable());
  });

  it("substituteOut", function() {
    var v1 = new c.Variable({ value: 20 });
    var v2 = new c.Variable({ value: 2 });
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
  });

  it("newSubject", function() {
    var v = new c.Variable({ value: 10 });
    var e = new c.Expression(v, 2, 5);

    t.is(e.newSubject(v), 1 / 2);
    t.is(e.constant, -2.5);
    t.is(null, e.terms.get(v));
    t.is(true, e.isConstant);
  });

  it("changeSubject", function() {
    var va = new c.Variable({ value: 10 });
    var vb = new c.Variable({ value: 5 });
    var e = new c.Expression(va, 2, 5);

    e.changeSubject(vb, va);
    t.is(e.constant, -2.5);
    t.is(null, e.terms.get(va));
    t.is(e.terms.get(vb), 0.5);
  });

  it("toString", function() {
    var v = new c.Variable({ name: "v", value: 5 });

    t.is(new c.Expression(10).toString(), '10');
    t.is(new c.Expression(v, 0, 10).toString(), '10 + 0*[v:5]');

    var e = new c.Expression(v, 2, 10);
    t.is(e.toString(), '10 + 2*[v:5]');

    e.setVariable(new c.Variable({ name: "b", value: 2 }), 4);
    t.is(e.toString(), '10 + 2*[v:5] + 4*[b:2]');
  });

  it("equals", function() {
    var v = new c.Variable({ name: "v", value: 5 });

    t.t(new c.Expression(10).equals(new c.Expression(10)));
    t.f(new c.Expression(10).equals(new c.Expression(1)));
    t.t(new c.Expression(v, 2, -1).equals(new c.Expression(v, 2, -1)));
    t.f(new c.Expression(v, -2, 5).equals(new c.Expression(v, 3, 6)));
  });

  it("plus", function() {
    var x = new c.Variable({ name: "x", value: 167 });
    var y = new c.Variable({ name: "y", value: 10 });

    t.is(c.plus(2, 3).toString(), '5');
    t.is(c.plus(x, 2).toString(), '2 + 1*[x:167]');
    t.is(c.plus(3, x).toString(), '3 + 1*[x:167]');
    t.is(c.plus(x, y).toString(), '1*[x:167] + 1*[y:10]');
  });

  it("minus", function() {
    var x = new c.Variable({ name: "x", value: 167 });
    var y = new c.Variable({ name: "y", value: 10 });

    t.is(c.minus(2, 3).toString(), '-1');
    t.is(c.minus(x, 2).toString(), '-2 + 1*[x:167]');
    t.is(c.minus(3, x).toString(), '3 + -1*[x:167]');
    t.is(c.minus(x, y).toString(), '1*[x:167] + -1*[y:10]');
  });

  it("times", function() {
    var x = new c.Variable({ name: "x", value: 167 });
    var y = new c.Variable({ name: "y", value: 10 });

    t.is(c.times(2, 3).toString(), '6');
    t.is(c.times(x, 2).toString(), '2*[x:167]');
    t.is(c.times(3, x).toString(), '3*[x:167]');
    t.throws(c.times.bind(c, x, y), c.NonExpression);
  });

  it("divide", function() {
    var x = new c.Variable({ name: "x", value: 167 });
    var y = new c.Variable({ name: "y", value: 10 });

    t.is(c.divide(4, 2).toString(), '2');
    t.is(c.divide(x, 2).toString(), '0.5*[x:167]');
    t.throws(c.divide.bind(c, 4, x), c.NonExpression);
    t.throws(c.divide.bind(c, x, y), c.NonExpression);
  });
});
})();
