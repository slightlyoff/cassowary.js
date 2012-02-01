// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;
// Has ClConstraint <- ClEditOrStayConstraint
// and     ClEditConstraint, ClStayConstraint
// Linear constraints are in ClLinearConstraint.js


(function(c) {
"use strict";

var count = 1;

c.Constraint = c.inherit({

  initialize: function(strength /*c.Strength*/, weight /*double*/) {
    /* FIELDS:
      var _attachedObject
      var _times_added
    */
    this.hash_code = count++;
    this.strength = strength || c.Strength.required;
    this.weight = weight || 1.0;
    this._times_added = 0;
  },

  hashCode: function() {
    return this.hash_code;
  },

  isEditConstraint: false,
  isInequality:     false,
  isStayConstraint: false,
  // FIXME(slightlyoff): value, at worst a getter
  isRequired: function() { return this.strength.isRequired(); },

  toString: function() {
    // this is abstract -- it intentionally leaves the parens unbalanced for
    // the subclasses to complete (e.g., with ' = 0', etc.
    return this.strength + " {" + this.weight + "} (" + this.expression +")";
  },

  setAttachedObject: function(o /*Object*/) {
    this._attachedObject = o;
  },

  getAttachedObject: function() {
    return this._attachedObject;
  },

  /* Never used!? */
  changeStrength: function(strength /*c.Strength*/) {
    if (this._times_added == 0) {
      this.strength = strength;
    } else {
      throw new c.TooDifficult();
    }
  },

  addedTo: function(solver /*c.SimplexSolver*/) {
    ++this._times_added;
  },

  removedFrom: function(solver /*c.SimplexSolver*/) {
    --this._times_added;
  },
});

var EditOrStayCtor = function(clv /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
  c.Constraint.call(this, strength, weight);
  this.variable = clv;
  this.expression = new c.LinearExpression(clv, -1.0, clv.value());
};

c.EditConstraint = c.inherit({
  extends: c.Constraint,
  initialize: function() {
    EditOrStayCtor.apply(this, arguments);
  },
  isEditConstraint: true,
  toString: function() { 
    return "edit:" + c.Constraint.prototype.toString.call(this);
  },
});

c.StayConstraint = c.inherit({
  extends: c.Constraint,
  initialize: function(clv /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
    EditOrStayCtor.call(this, clv, strength || c.Strength.weak, weight);
  },
  isStayConstraint: true,
  toString: function() { 
    return "stay:" + c.Constraint.prototype.toString.call(this);
  },
});

})(c);
