// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.Constraint = c.inherit({
  initialize: function(strength /*c.Strength*/, weight /*double*/) {
    this.hash_code = c._inc();
    this.strength = strength || c.Strength.required;
    this.weight = weight || 1;
  },

  isEditConstraint: false,
  isInequality:     false,
  isStayConstraint: false,
  hashCode: function() { return this.hash_code; },
  // FIXME(slightlyoff): value, at worst a getter
  isRequired: function() { return this.strength.isRequired(); },

  toString: function() {
    // this is abstract -- it intentionally leaves the parens unbalanced for
    // the subclasses to complete (e.g., with ' = 0', etc.
    return this.strength + " {" + this.weight + "} (" + this.expression +")";
  },
});

var ts = c.Constraint.prototype.toString;

var EditOrStayCtor = function(clv /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
  c.Constraint.call(this, strength || c.Strength.strong, weight);
  this.variable = clv;
  this.expression = new c.LinearExpression(clv, -1, clv.value());
};

c.EditConstraint = c.inherit({
  extends: c.Constraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isEditConstraint: true,
  toString: function() { return "edit:" + ts.call(this); },
});

c.StayConstraint = c.inherit({
  extends: c.Constraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isStayConstraint: true,
  toString: function() { return "stay:" + ts.call(this); },
});

})(c);
