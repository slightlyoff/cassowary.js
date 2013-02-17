// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

(function() {
"use strict";

var c = require("../");
// DOH Compat.
var t = require("chai").assert;
t.is = t.deepEqual;
t.t = t;
t.f = function(obj, str) {
  return t.t(!obj, str);
};

describe("End-To-End", function() {

  describe("simple1", function() {
    var solver = new c.SimplexSolver();

    var x = new c.Variable({ value: 167 });
    var y = new c.Variable({ value: 2 });
    var eq = new c.Equation(x, new c.Expression(y));

    solver.addConstraint(eq);
    t.t(x.value == y.value);
    t.is(x.value, 0);
    t.is(y.value, 0);
  });

  describe("justStay1", function() {
    var x = new c.Variable({ value: 5 });
    var y = new c.Variable({ value: 10 });
    var solver = new c.SimplexSolver();
    solver.addStay(x);
    solver.addStay(y);
    t.t(c.approx(x, 5));
    t.t(c.approx(y, 10));
    t.is(x.value, 5);
    t.is(y.value, 10);
  });

  describe("var >= num", function() {
      // x >= 100
      var solver = new c.SimplexSolver();

      var x = new c.Variable({ value: 10 });
      var ieq = new c.Inequality(x, c.GEQ, 100);
      solver.addConstraint(ieq);
      t.is(x.value, 100);
  });

  describe("num == var", function() {
    // 100 == var
    var solver = new c.SimplexSolver();

    var x = new c.Variable({ value: 10 });
    var eq = new c.Equation(100, x);
    solver.addConstraint(eq);
    t.is(x.value, 100);
  });

  describe("num <= var", function() {
      // x >= 100
      var solver = new c.SimplexSolver();

      var x = new c.Variable({ value: 10 });
      var ieq = new c.Inequality(100, c.LEQ, x);
      solver.addConstraint(ieq);

      t.is(x.value, 100);
  });

  describe("exp >= num", function() {
      // stay width
      // right >= 100
      var solver = new c.SimplexSolver();

      // x = 10
      var x = new c.Variable({ value: 10 });
      // width = 10
      var width = new c.Variable({ value: 10 });
      // right = x + width
      var right = new c.Expression(x).plus(width);
      // right >= 100
      var ieq = new c.Inequality(right, c.GEQ, 100);
      solver.addStay(width)
      solver.addConstraint(ieq);

      t.is(x.value, 90);
      t.is(width.value, 10);
  });

  describe("num <= exp", function() {
      // stay width
      // 100 <= right
      var solver = new c.SimplexSolver();

      var x = new c.Variable({ value: 10 });
      var width = new c.Variable({ value: 10 });
      var right = new c.Expression(x).plus(width);
      var ieq = new c.Inequality(100, c.LEQ, right);

      solver.addStay(width)
            .addConstraint(ieq);

      t.is(x.value, 90);
      t.is(width.value, 10);
  });

  describe("exp == var", function() {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x = new c.Variable({ value: 10 });
      var width = new c.Variable({ value: 10 });
      var rightMin = new c.Variable({ value: 100 });
      var right = new c.Expression(x).plus(width);
      var eq = new c.Equation(right, rightMin);

      solver.addStay(width)
            .addStay(rightMin)
            .addConstraint(eq);

      t.is(x.value, 90);
      t.is(width.value, 10);
  });

  describe("exp >= var", function() {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x = new c.Variable({ value: 10 });
      var width = new c.Variable({ value: 10 });
      var rightMin = new c.Variable({ value: 100 });
      var right = new c.Expression(x).plus(width);
      var ieq = new c.Inequality(right, c.GEQ, rightMin);

      solver.addStay(width)
            .addStay(rightMin)
            .addConstraint(ieq);

      t.is(x.value, 90);
      t.is(width.value, 10);
  });

  describe("var <= exp", function() {
      // stay width
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x = new c.Variable({ value: 10 });
      var width = new c.Variable({ value: 10 });
      var rightMin = new c.Variable({ value: 100 });
      var right = new c.Expression(x).plus(width);
      var ieq = new c.Inequality(rightMin, c.LEQ, right);
      solver.addStay(width)
            .addStay(rightMin)
            .addConstraint(ieq);

      t.is(x.value, 90);
      t.is(width.value, 10);
  });

  describe("exp == exp", function() {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x1 = new c.Variable({ value: 10 });
      var width1 = new c.Variable({ value: 10 });
      var right1 = new c.Expression(x1).plus(width1);
      var x2 = new c.Variable({ value: 100 });
      var width2 = new c.Variable({ value: 10 });
      var right2 = new c.Expression(x2).plus(width2);

      var eq = new c.Equation(right1, right2);

      solver.addStay(width1)
            .addStay(width2)
            .addStay(x2)
            .addConstraint(eq);

      t.is(x1.value, 100);
      t.is(x2.value, 100);
      t.is(width1.value, 10);
      t.is(width2.value, 10);
  });

  describe("exp >= exp", function() {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x1 = new c.Variable({ value: 10 });
      var width1 = new c.Variable({ value: 10 });
      var right1 = new c.Expression(x1).plus(width1);
      var x2 = new c.Variable({ value: 100 });
      var width2 = new c.Variable({ value: 10 });
      var right2 = new c.Expression(x2).plus(width2);

      var ieq = new c.Inequality(right1, c.GEQ, right2);

      solver.addStay(width1)
            .addStay(width2)
            .addStay(x2)
            .addConstraint(ieq);

      t.is(x1.value, 100);
  });

  describe("exp <= exp", function() {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x1 = new c.Variable({ value: 10 });
      var width1 = new c.Variable({ value: 10 });
      var right1 = new c.Expression(x1).plus(width1);
      var x2 = new c.Variable({ value: 100 });
      var width2 = new c.Variable({ value: 10 });
      var right2 = new c.Expression(x2).plus(width2);
      var ieq = new c.Inequality(right2, c.LEQ, right1);

      solver.addStay(width1)
            .addStay(width2)
            .addStay(x2)
            .addConstraint(ieq);

      t.is(x1.value, 100);
  });

  describe("addDelete1", function() {
    var solver = new c.SimplexSolver();
    var x = new c.Variable({ name: "x" });
    var cbl = new c.Equation(x, 100, c.Strength.weak);
    solver.addConstraint(cbl);

    var c10 = new c.Inequality(x, c.LEQ, 10);
    var c20 = new c.Inequality(x, c.LEQ, 20);
    solver.addConstraint(c10)
          .addConstraint(c20);
    t.t(c.approx(x, 10));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 20));

    solver.removeConstraint(c20);
    t.t(c.approx(x, 100));

    var c10again = new c.Inequality(x, c.LEQ, 10);
    solver.addConstraint(c10)
          .addConstraint(c10again);
    t.t(c.approx(x, 10));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 10));

    solver.removeConstraint(c10again);
    t.t(c.approx(x, 100));
  });

  describe("addDelete2", function() {
    var solver = new c.SimplexSolver();
    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });

    solver.addConstraint(new c.Equation(x, 100, c.Strength.weak))
          .addConstraint(new c.Equation(y, 120, c.Strength.strong));
    var c10 = new c.Inequality(x, c.LEQ, 10);
    var c20 = new c.Inequality(x, c.LEQ, 20);
    solver.addConstraint(c10)
          .addConstraint(c20);
    t.t(c.approx(x, 10));
    t.t(c.approx(y, 120));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 20));
    t.t(c.approx(y, 120));

    var cxy = new c.Equation(c.times(2, x), y);
    solver.addConstraint(cxy);
    t.t(c.approx(x, 20));
    t.t(c.approx(y, 40));

    solver.removeConstraint(c20);
    t.t(c.approx(x, 60));
    t.t(c.approx(y, 120));

    solver.removeConstraint(cxy);
    t.t(c.approx(x, 100));
    t.t(c.approx(y, 120));
  });

  describe("casso1", function() {
    var solver = new c.SimplexSolver();
    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });

    solver.addConstraint(new c.Inequality(x, c.LEQ, y))
          .addConstraint(new c.Equation(y, c.plus(x, 3)))
          .addConstraint(new c.Equation(x, 10, c.Strength.weak))
          .addConstraint(new c.Equation(y, 10, c.Strength.weak));

    t.t(
        (c.approx(x, 10) && c.approx(y, 13)) ||
        (c.approx(x,  7) && c.approx(y, 10))
    );
  });

  describe("inconsistent1", function() {
    var solver = new c.SimplexSolver();
    var x = new c.Variable({ name: "x" });
    // x = 10
    solver.addConstraint(new c.Equation(x, 10));
    // x = 5
    t.throws(solver.addConstraint.bind(solver, new c.Equation(x, 5)),
             c.RequiredFailure);
  });

  describe("inconsistent2", function() {
    var solver = new c.SimplexSolver();
    var x = new c.Variable({ name: "x" });
    solver.addConstraint(new c.Inequality(x, c.GEQ, 10));
    t.throws(solver.addConstraint.bind(solver, new c.Inequality(x, c.LEQ, 5)),
             c.RequiredFailure);
  });

  describe("inconsistent3", function() {
    var solver = new c.SimplexSolver();
    var w = new c.Variable({ name: "w" });
    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });
    var z = new c.Variable({ name: "z" });
    solver.addConstraint(new c.Inequality(w, c.GEQ, 10))
          .addConstraint(new c.Inequality(x, c.GEQ, w))
          .addConstraint(new c.Inequality(y, c.GEQ, x))
          .addConstraint(new c.Inequality(z, c.GEQ, y))
          .addConstraint(new c.Inequality(z, c.GEQ, 8));

    t.throws(solver.addConstraint.bind(solver, new c.Inequality(z, c.LEQ, 4)),
             c.RequiredFailure);
  });

  describe("inconsistent4", function() {
    var solver = new c.SimplexSolver();
    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });
    // x = 10
    solver.addConstraint(new c.Equation(x, 10));
    // x = y
    solver.addConstraint(new c.Equation(x, y));
    // y = 5. Should fail.
    t.throws(solver.addConstraint.bind(solver, new c.Equation(y, 5)),
             c.RequiredFailure);
  });

  describe("multiedit", function() {
    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });
    var w = new c.Variable({ name: "w" });
    var h = new c.Variable({ name: "h" });
    var solver = new c.SimplexSolver();
    solver.addStay(x)
          .addStay(y)
          .addStay(w)
          .addStay(h)
          .addEditVar(x)
          .addEditVar(y).beginEdit();
    solver.suggestValue(x, 10)
          .suggestValue(y, 20).resolve();
    t.t(c.approx(x, 10));
    t.t(c.approx(y, 20));
    t.t(c.approx(w, 0));
    t.t(c.approx(h, 0));

    solver.addEditVar(w)
          .addEditVar(h).beginEdit();
    solver.suggestValue(w, 30)
          .suggestValue(h, 40).endEdit();
    t.t(c.approx(x, 10));
    t.t(c.approx(y, 20));
    t.t(c.approx(w, 30));
    t.t(c.approx(h, 40));

    solver.suggestValue(x, 50)
          .suggestValue(y, 60).endEdit();
    t.t(c.approx(x, 50));
    t.t(c.approx(y, 60));
    t.t(c.approx(w, 30));
    t.t(c.approx(h, 40));
  });

  describe("multiedit2", function() {
    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });
    var w = new c.Variable({ name: "w" });
    var h = new c.Variable({ name: "h" });
    var solver = new c.SimplexSolver();
    solver.addStay(x)
          .addStay(y)
          .addStay(w)
          .addStay(h)
          .addEditVar(x)
          .addEditVar(y).beginEdit();
    solver.suggestValue(x, 10)
          .suggestValue(y, 20).resolve();
    solver.endEdit();
    t.t(c.approx(x, 10));
    t.t(c.approx(y, 20));
    t.t(c.approx(w, 0));
    t.t(c.approx(h, 0));

    solver.addEditVar(w)
          .addEditVar(h).beginEdit();
    solver.suggestValue(w, 30)
          .suggestValue(h, 40).endEdit();
    t.t(c.approx(x, 10));
    t.t(c.approx(y, 20));
    t.t(c.approx(w, 30));
    t.t(c.approx(h, 40));

    solver.addEditVar(x)
          .addEditVar(y).beginEdit();
    solver.suggestValue(x, 50)
          .suggestValue(y, 60).endEdit();
    t.t(c.approx(x, 50));
    t.t(c.approx(y, 60));
    t.t(c.approx(w, 30));
    t.t(c.approx(h, 40));
  });

  describe("multiedit3", function() {
    var rand = function(max, min) {
      min = (typeof min != "undefined") ? min : 0;
      max = max || Math.pow(2, 26);
      return parseInt(Math.random() * (max-min), 10) + min;
    };
    var MAX = 500;
    var MIN = 100;

    var weak = c.Strength.weak;
    var medium = c.Strength.medium;
    var strong = c.Strength.strong;
    var required = c.Strength.required;

    var eq  = function(a1, a2, strength, w) {
      return new c.Equation(a1, a2, strength || weak, w||0);
    };

    var v = {
      width: new c.Variable({ name: "width" }),
      height: new c.Variable({ name: "height" }),
      top: new c.Variable({ name: "top" }),
      bottom: new c.Variable({ name: "bottom" }),
      left: new c.Variable({ name: "left" }),
      right: new c.Variable({ name: "right" }),
    };

    var solver = new c.SimplexSolver();

    var iw = new c.Variable({
      name: "window_innerWidth",
      value: rand(MAX, MIN)
    });
    var ih = new c.Variable({
      name: "window_innerHeight",
      value: rand(MAX, MIN)
    });
    var iwStay = new c.StayConstraint(iw);
    var ihStay = new c.StayConstraint(ih);

    var widthEQ = eq(v.width, iw, strong);
    var heightEQ = eq(v.height, ih, strong);

    var constraints = [
      widthEQ,
      heightEQ,
      eq(v.top, 0, weak),
      eq(v.left, 0, weak),
      eq(v.bottom, c.plus(v.top, v.height), medium),
      // Right is at least left + width
      eq(v.right,  c.plus(v.left, v.width), medium),
      iwStay,
      ihStay
    ].forEach(function(c) {
      solver.addConstraint(c);
    });

    // Propigate viewport size changes.
    var reCalc = function() {

      // Measurement should be cheap here.
      var iwv = rand(MAX, MIN);
      var ihv = rand(MAX, MIN);

      solver.addEditVar(iw);
      solver.addEditVar(ih);

      solver.beginEdit();
      solver.suggestValue(iw, iwv)
            .suggestValue(ih, ihv);
      solver.resolve();
      solver.endEdit();

      t.is(v.top.value, 0);
      t.is(v.left.value, 0);
      t.t(v.bottom.value <= MAX);
      t.t(v.bottom.value >= MIN);
      t.t(v.right.value <= MAX);
      t.t(v.right.value >= MIN);

    }.bind(this);
    reCalc();
    reCalc();
    reCalc();
  });

  describe("errorWeights", function() {
    var solver = new c.SimplexSolver();

    var weak = c.Strength.weak;
    var medium = c.Strength.medium;
    var strong = c.Strength.strong;
    var required = c.Strength.required;

    var eq  = function(a1, a2, strength, w) {
      return new c.Equation(a1, a2, strength || weak, w||0);
    };

    var x = new c.Variable({ name: "x", value: 100 });
    var y = new c.Variable({ name: "y", value: 200 });
    var z = new c.Variable({ name: "z", value: 50 });
    t.is(x.value, 100);
    t.is(y.value, 200);
    t.is(z.value,  50);

    solver.addConstraint(new c.Equation(z,   x,   weak))
          .addConstraint(new c.Equation(x,  20,   weak))
          .addConstraint(new c.Equation(y, 200, strong));

    t.is(x.value,  20);
    t.is(y.value, 200);
    t.is(z.value,  20);

    solver.addConstraint(
      new c.Inequality(c.plus(z, 150), c.LEQ, y, medium)
    );

    t.is(x.value,  20);
    t.is(y.value, 200);
    t.is(z.value,  20);
  });
});

})();
