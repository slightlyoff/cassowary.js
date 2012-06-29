// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

(function() {

"use strict";

doh.add("End-To-End", [

  function simple1(t) {
    var solver = new c.SimplexSolver();

    var x = new c.Variable(167);
    var y = new c.Variable(2);
    var eq = new c.Equation(x, new c.Expression(y));

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
      var ieq = new c.Inequality(x, c.GEQ, 100);
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
      var eq = new c.Equation(100, x);
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
      var ieq = new c.Inequality(100, c.LEQ, x);
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

      // x = 10
      var x = new c.Variable(10);
      // width = 10
      var width = new c.Variable(10);
      // right = x + width
      var right = new c.Expression(x).plus(width);
      // right >= 100
      var ieq = new c.Inequality(right, c.GEQ, 100);
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
      var right = new c.Expression(x).plus(width);
      var ieq = new c.Inequality(100, c.LEQ, right);

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
      var right = new c.Expression(x).plus(width);
      var eq = new c.Equation(right, rightMin);

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
      var right = new c.Expression(x).plus(width);
      var ieq = new c.Inequality(right, c.GEQ, rightMin);

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
      var right = new c.Expression(x).plus(width);
      var ieq = new c.Inequality(rightMin, c.LEQ, right);
      solver.addStay(width)
            .addStay(rightMin)
            .addConstraint(ieq);    

      t.is(x.value(), 90);
      t.is(width.value(), 10);
    }
  },
  
  {
    name: "exp == exp",
    runTest: function(t) {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x1 = new c.Variable(10);
      var width1 = new c.Variable(10);
      var right1 = new c.Expression(x1).plus(width1);
      var x2 = new c.Variable(100);
      var width2 = new c.Variable(10);
      var right2 = new c.Expression(x2).plus(width2);
      
      var eq = new c.Equation(right1, right2);

      solver.addStay(width1)
            .addStay(width2)
            .addStay(x2)
            .addConstraint(eq);    

      t.is(x1.value(), 100);
      t.is(x2.value(), 100);
      t.is(width1.value(), 10);
      t.is(width2.value(), 10);
    }
  },
  
  {    
    name: "exp >= exp",
    runTest: function(t) {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x1 = new c.Variable(10);
      var width1 = new c.Variable(10);
      var right1 = new c.Expression(x1).plus(width1);
      var x2 = new c.Variable(100);
      var width2 = new c.Variable(10);
      var right2 = new c.Expression(x2).plus(width2);

      var ieq = new c.Inequality(right1, c.GEQ, right2);

      solver.addStay(width1)
            .addStay(width2)
            .addStay(x2)
            .addConstraint(ieq);    

      t.is(x1.value(), 100);

    }
  },
  
  {    
    name: "exp <= exp",
    runTest: function(t) {
      // stay width, rightMin
      // right >= rightMin
      var solver = new c.SimplexSolver();

      var x1 = new c.Variable(10);
      var width1 = new c.Variable(10);
      var right1 = new c.Expression(x1).plus(width1);
      var x2 = new c.Variable(100);
      var width2 = new c.Variable(10);
      var right2 = new c.Expression(x2).plus(width2);
      var ieq = new c.Inequality(right2, c.LEQ, right1);

      solver.addStay(width1)
            .addStay(width2)
            .addStay(x2)
            .addConstraint(ieq);    

      t.is(x1.value(), 100);

    }
  },
  
  function addDelete1(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    var cbl = new c.Equation(x, 100, c.Strength.weak);
    solver.addConstraint(cbl);

    var c10 = new c.Inequality(x, c.LEQ, 10.0);
    var c20 = new c.Inequality(x, c.LEQ, 20.0);
    solver.addConstraint(c10)
          .addConstraint(c20);
    t.t(c.approx(x, 10.0));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 20.0));

    solver.removeConstraint(c20);
    t.t(c.approx(x, 100.0));

    var c10again = new c.Inequality(x, c.LEQ, 10.0);
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

    solver.addConstraint(new c.Equation(x, 100.0, c.Strength.weak))
          .addConstraint(new c.Equation(y, 120.0, c.Strength.strong));
    var c10 = new c.Inequality(x, c.LEQ, 10.0);
    var c20 = new c.Inequality(x, c.LEQ, 20.0);
    solver.addConstraint(c10)
          .addConstraint(c20);
    t.t(c.approx(x, 10.0));
    t.t(c.approx(y, 120.0));

    solver.removeConstraint(c10);
    t.t(c.approx(x, 20.0));
    t.t(c.approx(y, 120.0));

    var cxy = new c.Equation(c.Times(2.0, x), y);
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

    solver.addConstraint(new c.Inequality(x, c.LEQ, y))
          .addConstraint(new c.Equation(y, c.Plus(x, 3.0)))
          .addConstraint(new c.Equation(x, 10.0, c.Strength.weak))
          .addConstraint(new c.Equation(y, 10.0, c.Strength.weak));

    t.t(
        (c.approx(x, 10.0) && c.approx(y, 13.0)) ||
        (c.approx(x,  7.0) && c.approx(y, 10.0))
    );
  },

  function inconsistent1(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    // x = 10
    solver.addConstraint(new c.Equation(x, 10.0));
    // x = 5
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.Equation(x, 5.0)
    ]);
  },

  function inconsistent2(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    solver.addConstraint(new c.Inequality(x, c.GEQ, 10.0));
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.Inequality(x, c.LEQ, 5.0)
    ]);
  },

  function inconsistent3(t) {
    var solver = new c.SimplexSolver();
    var w = new c.Variable("w");
    var x = new c.Variable("x");
    var y = new c.Variable("y");
    var z = new c.Variable("z");
    solver.addConstraint(new c.Inequality(w, c.GEQ, 10.0))
          .addConstraint(new c.Inequality(x, c.GEQ, w))
          .addConstraint(new c.Inequality(y, c.GEQ, x))
          .addConstraint(new c.Inequality(z, c.GEQ, y))
          .addConstraint(new c.Inequality(z, c.GEQ, 8.0));
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.Inequality(z, c.LEQ, 4.0)
    ]);
  },

  function inconsistent4(t) {
    var solver = new c.SimplexSolver();
    var x = new c.Variable("x");
    var y = new c.Variable("y");
    // x = 10
    solver.addConstraint(new c.Equation(x, 10.0));
    // x = y
    solver.addConstraint(new c.Equation(x, y));
    // y = 5. Should fail.
    t.e(c.RequiredFailure, solver, "addConstraint", [
      new c.Equation(y, 5.0)
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

  function multiedit2(t) {
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
  },

  function multiedit3(t) {
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
      width: new c.Variable("width"),
      height: new c.Variable("height"),
      top: new c.Variable("top"),
      bottom: new c.Variable("bottom"),
      left: new c.Variable("left"),
      right: new c.Variable("right"),
    };

    var solver = new c.SimplexSolver();

    var iw = new c.Variable("window_innerWidth", rand(MAX, MIN));
    var ih = new c.Variable("window_innerHeight", rand(MAX, MIN));
    var iwStay = new c.StayConstraint(iw);
    var ihStay = new c.StayConstraint(ih);

    var widthEQ = eq(v.width, iw, strong);
    var heightEQ = eq(v.height, ih, strong);

    var constraints = [
      widthEQ,
      heightEQ,
      eq(v.top, 0, weak),
      eq(v.left, 0, weak),
      eq(v.bottom, c.Plus(v.top, v.height), medium),
      // Right is at least left + width
      eq(v.right,  c.Plus(v.left, v.width), medium),
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

      t.is(v.top.value(), 0);
      t.is(v.left.value(), 0);
      t.t(v.bottom.value() <= MAX);
      t.t(v.bottom.value() >= MIN);
      t.t(v.right.value() <= MAX);
      t.t(v.right.value() >= MIN);

    }.bind(this);
    reCalc();
    reCalc();
    reCalc();
  },

  function errorWeights(t) {
    var solver = new c.SimplexSolver();

    var weak = c.Strength.weak;
    var medium = c.Strength.medium;
    var strong = c.Strength.strong;
    var required = c.Strength.required;

    var eq  = function(a1, a2, strength, w) {
      return new c.Equation(a1, a2, strength || weak, w||0);
    };

    var x = new c.Variable("x", 100);
    var y = new c.Variable("y", 200);
    var z = new c.Variable("z",  50);
    t.is(x.value(), 100);
    t.is(y.value(), 200);
    t.is(z.value(),  50);

    solver.addConstraint(new c.Equation(z,   x,   weak))
          .addConstraint(new c.Equation(x,  20,   weak))
          .addConstraint(new c.Equation(y, 200, strong));

    t.is(x.value(),  20);
    t.is(y.value(), 200);
    t.is(z.value(),  20);

    solver.addConstraint(
      new c.Inequality(c.Plus(z, 150), c.LEQ, y, medium)
    );

    t.is(x.value(),  20);
    t.is(y.value(), 200);
    t.is(z.value(),  20);
  },
]);

})();
