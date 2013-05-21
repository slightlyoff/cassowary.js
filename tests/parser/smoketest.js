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

var chai = require('chai');
describe('with a valid expression', function () {
  var exp = null;
  var values = null;
  var solver = null;
  it('should return a list of Constraints', function () {
    exp = c('a + b == c');
    chai.expect(exp).to.be.an('array');
    chai.expect(exp[0]).to.be.instanceOf(c.Constraint);
  });
  it('should contain the variables', function () {
    var terms = exp[0].expression.terms;
    var found = 0;
    terms.each(function (variable) {
      found++;
      chai.expect(variable).to.be.instanceOf(c.Variable);
    });
    chai.expect(found).to.equal(3);
  });
  it('should be convertable to a Constraint', function () {
    solver = new c.SimplexSolver();
    solver.addConstraint(exp[0]);
  });
  it('should have initial value of 0', function () {
    exp[0].expression.terms.each(function (variable) {
      if (variable.name === 'b') {
        chai.expect(variable.value).to.equal(0);
      }
    });
  });
  describe('with values provided', function () {
    it('should be solvable', function () {
      var aVal = c('a == 5');
      solver.addConstraint(aVal[0]);
      var cVal = c('c == 7');
      solver.addConstraint(cVal[0]);
      exp[0].expression.terms.each(function (variable) {
        if (variable.name === 'b') {
          chai.expect(variable.value).to.equal(2);
        }
      });
    });
  });

  it("can parse a multiplication", function() {
    t.t(typeof c("10*a==30") == "object");
  });
});

})();
