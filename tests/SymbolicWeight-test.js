// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Rusell (slightlyoff@chromium.org)

"use strict";

doh.add("c.SymbolicWeight", [
  function addMult(t) {
    var c1 = new c.SymbolicWeight(1,1,1);
    var c2 = new c.SymbolicWeight(2,3,4);
    var c3 = c1.add(c2);
    t.is(c3, "[3,4,5]");
    t.is(c3.times(4), "[12,16,20]");
  },
]);
