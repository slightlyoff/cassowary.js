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

describe("new api", function() {
  it("informs on variable changes", function() {
    var changes = [];
    c("a+b==c");
    c(function(change){
      changes.push(change);
    });
    c("a==1");
    c("b==0");

    t.is(2, changes.length);
    t.property(changes[0], "a");
    t.property(changes[0], "b");
    t.property(changes[0], "c");

    t.property(changes[1], "b");
    t.property(changes[1], "c");
  })
});

})();
