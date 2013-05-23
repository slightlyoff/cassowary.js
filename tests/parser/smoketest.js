// Copyright (C) 2013, Alex Russell <slightlyoff@chromium.org>
// Use of this source code is governed by
//    http://www.apache.org/licenses/LICENSE-2.0

(function() {
"use strict";

var c = require("../../");
// DOH Compat.
var t = require("chai").assert;
t.is = t.deepEqual;
t.t = t;
t.f = function(obj, str) {
  return t.t(!obj, str);
};

describe("parser smoketests", function() {
  it("should have a meaningful c._api", function() {
    t.t(typeof c._api == "function");
  });

  it("can parse an empty string", function() {
    c("");
  });

  it("returns a parse object", function() {
    t.t(typeof c("") == "object");
  });
});

})();
