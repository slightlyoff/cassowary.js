// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Rusell (slightlyoff@chromium.org)

(function() {

"use strict";

doh.add("End-To-End", [

  function simple1(t) {
    var solver = new c.SimplexSolver();

    var x = new c.Variable(167);
    var y = new c.Variable(2);
    var eq = new c.LinearEquation(x, new c.LinearExpression(y));

    solver.addConstraint(eq);
    t.t(x.value() == y.value());
    t.is(x.value(), 0);
    t.is(y.value(), 0);
  },

  function justStay1(t) {
    var x = new c.Variable(5);
    var y = new c.Variable(10);
    var solver = new c.SimplexSolver();
    solver.addStay(x);
    solver.addStay(y);
    t.t(c.approx(x, 5));
    t.t(c.approx(y, 10));
    t.is(x.value(), 5);
    t.is(y.value(), 10);
  },
  
  {
    name: "var >= num",
    runTest: function(t) {
      // x >= 100
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var ieq = new c.LinearInequality(x, c.GEQ, 100);
      solver.addConstraint(ieq);    
      t.is(x.value(), 100);
    }
  },
  
  {
    name: "num == var",
    runTest: function(t) {
      // 100 == var
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var eq = new c.LinearEquation(100, x);
      solver.addConstraint(eq);    
      t.is(x.value(), 100);
    }
  },
  
  {
    name: "num <= var",
    runTest: function(t) {
      // x >= 100
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var ieq = new c.LinearInequality(100, c.LEQ, x);
      solver.addConstraint(ieq);    

      t.is(x.value(), 100);
    }
  },
  
  {
    name: "exp >= num",
    runTest: function(t) {
      // stay width
      // right >= 100
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var width = new c.Variable(10);
      var right = new c.LinearExpression(x).plus(width);
      var ieq = new c.LinearInequality(right, c.GEQ, 100);
      solver.addStay(width)
      solver.addConstraint(ieq);    

      t.is(x.value(), 90);
      t.is(width.value(), 10);
    }
  },
  
  {
    name: "num <= exp",
    runTest: function(t) {
      // stay width
      // 100 <= right
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var width = new c.Variable(10);
      var right = new c.LinearExpression(x).plus(width);
      var ieq = new c.LinearInequality(100, c.LEQ, right);

      solver.addStay(width)
            .addConstraint(ieq);    

      t.is(x.value(), 90);
      t.is(width.value(), 10);
    }
  },
  
  {
    name: "exp == var",
    runTest: function(t) {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var width = new c.Variable(10);
      var rightMin = new c.Variable(100);
      var right = new c.LinearExpression(x).plus(width);
      var eq = new c.LinearEquation(right, rightMin);

      solver.addStay(width)
            .addStay(rightMin)
            .addConstraint(eq);    

      t.is(x.value(), 90);
      t.is(width.value(), 10);
    }
  },
  
  {
    name: "exp >= var",
    runTest: function(t) {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var width = new c.Variable(10);
      var rightMin = new c.Variable(100);
      var right = new c.LinearExpression(x).plus(width);
      var ieq = new c.LinearInequality(right, c.GEQ, rightMin);

      solver.addStay(width)
            .addStay(rightMin)
            .addConstraint(ieq);    

      t.is(x.value(), 90);
      t.is(width.value(), 10);
    }
  },
  
  {
    name: "var <= exp",
    runTest: function(t) {
      // stay width
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x = new c.Variable(10);
      var width = new c.Variable(10);
      var rightMin = new c.Variable(100);
      var right = new c.LinearExpression(x).plus(width);
      var ieq = new c.LinearInequality(rightMin, c.LEQ, right);
      solver.addStay(width)
            .addStay(rightMin)
            .addConstraint(ieq);    

      t.is(x.value(), 90);
      t.is(width.value(), 10);
    }
  },

  function addDelete1(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    var cbl = new c.LinearEquation(x, 100, c.Strength.weak);
    solver.addConstraint(cbl);

    var c10 = new c.LinearInequality(x, c.LEQ, 10.0);
    var c20 = new c.LinearInequality(x, c.LEQ, 20.0);
    solver.addConstraint(c10)
          .addConstraint(c20);
    t.t(c.approx(x, 10.0));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 20.0));

    solver.removeConstraint(c20);
    t.t(c.approx(x, 100.0));

    var c10again = new c.LinearInequality(x, c.LEQ, 10.0);
    solver.addConstraint(c10)
          .addConstraint(c10again);
    t.t(c.approx(x, 10.0));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 10.0));

    solver.removeConstraint(c10again);
    t.t(c.approx(x, 100.0));
  },

  function addDelete2(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    var y = new c.Variable("y");

    solver.addConstraint(new c.LinearEquation(x, 100.0, c.Strength.weak))
          .addConstraint(new c.LinearEquation(y, 120.0, c.Strength.strong));
    var c10 = new c.LinearInequality(x, c.LEQ, 10.0);
    var c20 = new c.LinearInequality(x, c.LEQ, 20.0);
    solver.addConstraint(c10)
          .addConstraint(c20);
    t.t(c.approx(x, 10.0));
    t.t(c.approx(y, 120.0));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 20.0));
    t.t(c.approx(y, 120.0));

    var cxy = new c.LinearEquation(c.Times(2.0, x), y);
    solver.addConstraint(cxy);
    t.t(c.approx(x, 20.0));
    t.t(c.approx(y, 40.0));

    solver.removeConstraint(c20);
    t.t(c.approx(x, 60.0));
    t.t(c.approx(y, 120.0));

    solver.removeConstraint(cxy);
    t.t(c.approx(x, 100.0));
    t.t(c.approx(y, 120.0));
  },

  function casso1(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    var y = new c.Variable("y");

    solver.addConstraint(new c.LinearInequality(x, c.LEQ, y))
          .addConstraint(new c.LinearEquation(y, c.Plus(x, 3.0)))
          .addConstraint(new c.LinearEquation(x, 10.0, c.Strength.weak))
          .addConstraint(new c.LinearEquation(y, 10.0, c.Strength.weak));

    t.t(
        (c.approx(x, 10.0) && c.approx(y, 13.0)) ||
        (c.approx(x,  7.0) && c.approx(y, 10.0))
    );
  },

  function inconsistent1(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    // x = 10
    solver.addConstraint(new c.LinearEquation(x, 10.0));
    // x = 5
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.LinearEquation(x, 5.0)
    ]);
  },

  function inconsistent2(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    solver.addConstraint(new c.LinearInequality(x, c.GEQ, 10.0));
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.LinearInequality(x, c.LEQ, 5.0)
    ]);
  },

  function inconsistent3(t) {
    var solver = new c.SimplexSolver();
    var w = new c.Variable("w");
    var x = new c.Variable("x");
    var y = new c.Variable("y");
    var z = new c.Variable("z");
    solver.addConstraint(new c.LinearInequality(w, c.GEQ, 10.0))
          .addConstraint(new c.LinearInequality(x, c.GEQ, w))
          .addConstraint(new c.LinearInequality(y, c.GEQ, x))
          .addConstraint(new c.LinearInequality(z, c.GEQ, y))
          .addConstraint(new c.LinearInequality(z, c.GEQ, 8.0));
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.LinearInequality(z, c.LEQ, 4.0)
    ]);
  },

  function inconsistent4(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    var y = new c.Variable("y");
    // x = 10
    solver.addConstraint(new c.LinearEquation(x, 10.0));
    // x = y
    solver.addConstraint(new c.LinearEquation(x, y));
    // y = 5. Should fail.
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.LinearEquation(y, 5.0)
    ]);
  },

  function multiedit(t) {
    var x = new c.Variable("x");
    var y = new c.Variable("y");
    var w = new c.Variable("w");
    var h = new c.Variable("h");
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
  },

]);

})();
