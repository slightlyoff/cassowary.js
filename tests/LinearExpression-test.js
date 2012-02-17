// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Rusell (slightlyoff@chromium.org)

"use strict";

doh.add("c.LinearExpression", [
  function threeVarCtor(t) {
    var x = new c.Variable("x", 167);
    var e = new c.LinearExpression(x, 2, 3);
    t.is(e, "3 + 2*[x:167]");
  },

  function oneParamCtor(t) {
    t.is(new c.LinearExpression(4), "4");
  },

  function plus(t) {
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
]);

