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

describe("c.Strength", function() {
  describe("::statics", function() {
    it("is an instanceof c.Strength", function(){
      t.t(c.Strength.required instanceof c.Strength);
      t.t(c.Strength.strong instanceof c.Strength);
      t.t(c.Strength.medium instanceof c.Strength);
      t.t(c.Strength.weak instanceof c.Strength);
    });
  });

  describe("statics required values", function() {
    it("is true for c.Strength.required", function() {
      t.t(c.Strength.required.required);
    });
    it("is false for all the others", function() {
      t.f(c.Strength.strong.required);
      t.f(c.Strength.medium.required);
      t.f(c.Strength.weak.required);
    });
  });

  it("is sane", function() {

    var s = new c.SimplexSolver();

    // x = 10
    // y = 20
    // z = x (weak)
    // z = y (strong)
    // z == 20

    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });
    var z = new c.Variable({ name: "z" });

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
  });

  describe("multiple stays/edits", function() {
    var s = new c.SimplexSolver();

    var x = new c.Variable({ name: "x" });
    var y = new c.Variable({ name: "y" });
    var z = new c.Variable({ name: "z" });

    s.addConstraint(new c.Equation(z, x, c.Strength.weak))
     .addConstraint(new c.Equation(z, y, c.Strength.strong));

    it("has sane edit behavior", function() {
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
    });

    it("can edit a second time correctly", function(){
      s.addEditVar(x)
       .addEditVar(y).beginEdit();

      s.suggestValue(x, 30)
       .suggestValue(y, 50).resolve();
      s.endEdit();

      t.t(c.approx(x.value, 30.0));
      t.t(c.approx(y.value, 50.0));
      t.t(c.approx(z.value, 50.0));
    });
  });

  // FIXME(slightlyoff): MOAR TESTS
});
})();