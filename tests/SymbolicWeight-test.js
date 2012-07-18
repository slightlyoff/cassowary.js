// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.SymbolicWeight", [
  function toJSON(t) {
    return;
    var c1 = new c.SymbolicWeight(1,1,1);
    var c2 = new c.SymbolicWeight(2,3,4);
    t.is(c1.toJSON(), '{"class":"c.SymbolicWeight","args":[1,1,1]}');
    t.is(c2.toJSON(), '{"class":"c.SymbolicWeight","args":[2,3,4]}');
  },

  function fromJSON(t) {
    c.fromJSON('{"class":"c.SymbolicWeight","value":100100100}');
  },
]);
