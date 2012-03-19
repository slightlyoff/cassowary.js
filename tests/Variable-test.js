// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.Variable", [
  function ctor(t) {
    c.Variable._map = [];
    var x = new c.Variable("x");
    var y = new c.Variable("y", 2);
    t.is((c.Variable._map)['x'], "[x:0]");
    t.is((c.Variable._map)['y'], "[y:2]");
  },

  function dummy(t) {
    var d = new c.DummyVariable("foo");
    t.is(d, "[foo:dummy]");
  },

  function objective(t) {
    var o = new c.ObjectiveVariable("obj");
    t.is(o, "[obj:obj]");
  },
  // FIXME(slightlyoff): MOAR TESTS
]);
