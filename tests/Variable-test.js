// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c._Variable", [
  function ctor(t) {
    c._Variable._map = [];
    var x = new c.Variable({name: "x"});
    var y = new c.Variable({name: "y", value: 2});
    t.is((c._Variable._map)["x"], "[x:0]");
    t.is((c._Variable._map)["y"], "[y:2]");
  },

  function dummy(t) {
    var d = new c.DummyVariable({ name: "foo" });
    t.is(d, "[foo:dummy]");
  },

  function objective(t) {
    var o = new c.ObjectiveVariable({ name: "obj" });
    t.is(o, "[obj:obj]");
  },

  function Variable(t) {
    var x = new c._Variable("x", 25);

    t.is(x.value, 25);
    t.is(x, "[x:25]");
    t.t(x.isExternal);
    t.f(x.isDummy);
    t.f(x.isPivotable);
    t.f(x.isRestricted);
  },

  function DummyVariable(t) {
    var x = new c.DummyVariable({ name: "x" });

    t.is(x, "[x:dummy]");
    t.f(x.isExternal);
    t.t(x.isDummy);
    t.f(x.isPivotable);
    t.t(x.isRestricted);
  },

  function ObjectiveVariable(t) {
    var x = new c.ObjectiveVariable({ name: "x" });

    t.is(x, "[x:obj]");
    t.f(x.isExternal);
    t.f(x.isDummy);
    t.f(x.isPivotable);
    t.f(x.isRestricted);
  },

  function SlackVariable(t) {
    var x = new c.SlackVariable({ name: "x" });

    t.is(x, "[x:slack]");
    t.f(x.isExternal);
    t.f(x.isDummy);
    t.t(x.isPivotable);
    t.t(x.isRestricted);
  },

  function approx(t) {
    t.t(c.approx(25, 25));
    t.f(c.approx(25, 26));
    t.t(c.approx(new c._Variable(25), new c._Variable(25)));
    t.f(c.approx(new c._Variable(25), new c._Variable(26)));
    t.t(c.approx(0, 0.000000001));
    t.f(c.approx(0, 0.00000001));
    t.t(c.approx(0.000000001, 0));
    t.f(c.approx(0.00000001, 0));
    t.t(c.approx(25, 25.000000001));
    t.f(c.approx(25, 25.000001));
  }
]);
