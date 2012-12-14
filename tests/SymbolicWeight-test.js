// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.SymbolicWeight", [
  function toJSON(t) {
    var c1 = new c.SymbolicWeight(1,1,1);
    var c2 = new c.SymbolicWeight(2,3,4);
    t.is(c1.toJSON(), {_t:"c.SymbolicWeight", value: 1001001});
    t.is(c2.toJSON(), {_t:"c.SymbolicWeight", value: 2003004});
  },

  function fromJSON(t) {
    t.is(
      c.parseJSON('{"_t":"c.SymbolicWeight","value":1001001}'),
      (new c.SymbolicWeight(1, 1, 1).toJSON())
    );
  },
]);
