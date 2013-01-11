// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
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

describe("c.Tableau", function() {
  describe("ctor", function() {
    it("doesn't blow up", function() {
      new c.Tableau();
    });

    it("has sane properties", function() {
      var tab = new c.Tableau();
      t.is(0, tab.columns.size);
      t.is(0, tab.rows.size);
      t.is(0, tab._infeasibleRows.size);
      t.is(0, tab._externalRows.size);
      t.is(0, tab._externalParametricVars.size);
    });
  });
  // FIXME(slightlyoff): MOAR TESTS
});
})();