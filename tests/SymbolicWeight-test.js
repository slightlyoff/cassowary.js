// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)


(function() {
"use strict";

var c = require("../src/c.js");
// DOH Compat.
var t = require("chai").assert;
t.is = t.deepEqual;
t.t = t;
t.f = function(obj, str) {
  return t.t(!obj, str);
};

describe("c.SymbolicWeight", function() {
  describe("ctor", function() {
    describe("no args", function() {
      var w = new c.SymbolicWeight();
      it("has the right weight", function() {
        t.is(0, w.value);
      });
    });
    describe("var args", function() {
      var w = new c.SymbolicWeight(1, 1);
      it("has the right weight", function() {
        t.is(1001, w.value);
      });
    });
  });

  describe("toJSON", function() {
    it("generates deeply equal, sane JSON serialization objects", function() {
      var c1 = new c.SymbolicWeight(1,1,1);
      t.is(c1.toJSON(), {_t:"c.SymbolicWeight", value: 1001001});

      var c2 = new c.SymbolicWeight(2,3,4);
      t.is(c2.toJSON(), {_t:"c.SymbolicWeight", value: 2003004});
    });
  });

  describe("fromJSON", function() {
    it("rehydrates correctly", function() {
      t.is(
        c.parseJSON('{"_t":"c.SymbolicWeight","value":1001001}'),
        (new c.SymbolicWeight(1, 1, 1).toJSON())
      );
    });
  });
});
})();