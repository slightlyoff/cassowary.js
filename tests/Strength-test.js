// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.Strength", [
  function constants(t) {
    t.t(c.Strength.required instanceof c.Strength);
    t.t(c.Strength.strong instanceof c.Strength);
    t.t(c.Strength.medium instanceof c.Strength);
    t.t(c.Strength.weak instanceof c.Strength);
  },

  function required(t) {
    t.t(c.Strength.required.required);
    t.f(c.Strength.strong.required);
    t.f(c.Strength.medium.required);
    t.f(c.Strength.weak.required);
  },

  function sane(t) {
    var s = new c.SimplexSolver();

    // x = 10
    // y = 20
    // z = x (weak)
    // z = y (strong)
    // z == 20

    var x = new c.Variable("x");
    var y = new c.Variable("y");
    var z = new c.Variable("z");

    s.addConstraint(new c.Equation(z, x, c.Strength.weak))
     .addConstraint(new c.Equation(z, y, c.Strength.strong));

    s.addStay(x)
     .addStay(y)
     .addEditVar(x)
     .addEditVar(y).beginEdit();

    s.suggestValue(x, 10)
     .suggestValue(y, 20).resolve();
    s.endEdit();
    t.t(c.approx(x.value, 10.0));
    t.t(c.approx(y.value, 20.0));
    t.t(c.approx(z.value, 20.0));
  },

  function stayEachTime(t) {
    var s = new c.SimplexSolver();

    var x = new c.Variable("x");
    var y = new c.Variable("y");
    var z = new c.Variable("z");

    s.addConstraint(new c.Equation(z, x, c.Strength.weak))
     .addConstraint(new c.Equation(z, y, c.Strength.strong));

    s.addStay(x)
     .addStay(y)
     .addEditVar(x)
     .addEditVar(y).beginEdit();

    s.suggestValue(x, 10)
     .suggestValue(y, 20).resolve();
    s.endEdit();

    t.t(c.approx(x.value, 10.0));
    t.t(c.approx(y.value, 20.0));
    t.t(c.approx(z.value, 20.0));

    s.addEditVar(x)
     .addEditVar(y).beginEdit();

    s.suggestValue(x, 30)
     .suggestValue(y, 50).resolve();
    s.endEdit();

    t.t(c.approx(x.value, 30.0));
    t.t(c.approx(y.value, 50.0));
    t.t(c.approx(z.value, 50.0));

  },

  // FIXME(slightlyoff): MOAR TESTS
]);

