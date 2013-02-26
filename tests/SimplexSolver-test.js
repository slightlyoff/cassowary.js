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

describe("c.SimplexSolver", function() {
  it("should be constructable without args", function() {
    new c.SimplexSolver();
  });

  // FIXME(slightlyoff): MOAR TESTS
  describe("addPointStays", function() {

  });
});

})();