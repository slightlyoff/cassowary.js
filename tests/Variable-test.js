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

describe("c.Variable", function() {
  describe("ctor", function() {
    it("names/maps correctly", function() {
      c.Variable._map = [];
      var x = new c.Variable({name: "x"});
      var y = new c.Variable({name: "y", value: 2});
      t.is((c.Variable._map)["x"]+"", "[x:0]");
      t.is((c.Variable._map)["y"]+"", "[y:2]");
    });
    it("has the correct properties", function() {
      var x = new c.Variable({ name: "x", value: 25 });

      t.is(x.value, 25);
      t.is(x+"", "[x:25]");
      t.t(x.isExternal);
      t.f(x.isDummy);
      t.f(x.isPivotable);
      t.f(x.isRestricted);
    });
  });
});

describe("c.DummyVariable", function() {
  describe("ctor", function() {
    it("serializes", function() {
      var d = new c.DummyVariable({ name: "foo" });
      t.is(d+"", "[foo:dummy]");
    });
    it("has the correct properties", function() {
      var x = new c.DummyVariable({ name: "x" });

      t.is(x+"", "[x:dummy]");
      t.f(x.isExternal);
      t.t(x.isDummy);
      t.f(x.isPivotable);
      t.t(x.isRestricted);
    });
  });
});

describe("c.ObjectiveVariable", function() {
  describe("ctor", function() {
    it("serializes", function() {
      var o = new c.ObjectiveVariable({ name: "obj" });
      t.is(o+"", "[obj:obj]");
    });
    it("has the correct properties", function() {
      var x = new c.ObjectiveVariable({ name: "x" });

      t.is(x+"", "[x:obj]");
      t.f(x.isExternal);
      t.f(x.isDummy);
      t.f(x.isPivotable);
      t.f(x.isRestricted);
    });
  });
});

describe("c.SlackVariable", function() {
  it("has the correct properties", function() {
    var x = new c.SlackVariable({ name: "x" });

    t.is(x+"", "[x:slack]");
    t.f(x.isExternal);
    t.f(x.isDummy);
    t.t(x.isPivotable);
    t.t(x.isRestricted);
  });
});

})();