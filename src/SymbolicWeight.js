// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

(function(c) {

c.SymbolicWeight = c.inherit(
  function(w1, w2, w3) {
    this._values = new Array(w1, w2, w3);
  },
  null,
  {
    times: function(n) {
      return new c.SymbolicWeight(this._values[0]*n,
                                  this._values[1]*n,
                                  this._values[2]*n);
    },
    divideBy: function(n) {
      return new c.SymbolicWeight(this._values[0]/n,
                                  this._values[1]/n,
                                  this._values[2]/n);
    },
    add: function(c) {
      return new c.SymbolicWeight(this._values[0]+c._values[0],
                                  this._values[1]+c._values[1],
                                  this._values[2]+c._values[2]);
    },

    subtract: function(c) {
      return new c.SymbolicWeight(this._values[0]-c._values[0],
                                  this._values[1]-c._values[1],
                                  this._values[2]-c._values[2]);
    },

    lessThan: function(c) {
      for (i = 0; i < this._values.length; ++i) {
        if (this._values[i] < c._values[i]) {
          return true;
        } else if (this._values[i] > c._values[i]) {
          return false;
        }
      }
      return false; // equal
    },
      
    lessThanOrEqual: function(c) {
      for (i = 0; i < this._values.length; ++i) {
        if (this._values[i] < c._values[i]) {
          return true;
        } else if (this._values[i] > c._values[i]) {
          return false;
        }
      }
      return true; // equal
    },

    equal: function(c) {
      for (i = 0; i < this._values.length; ++i) {
        if (this._values[i] != c._values[i]) {
          return false;
        }
      }
      return true;
    },

    greaterThan: function(c) {
      return !this.lessThanOrEqual(c);
    },

    greaterThanOrEqual: function(c) {
      return !this.lessThan(c);
    },

    isNegative: function() {
      return this.lessThan(c.SymbolicWeight.clsZero);
    },

    toDouble: function() {
      sum  =  0;
      factor = 1;
      multiplier = 1000;
      for (i = this._values.length - 1; i >= 0; --i) {
        sum += this._values[i] * factor;
        factor *= multiplier;
      }
      return sum;
    },

    toString: function() {
      return '[' + this._values[0] + ','
        + this._values[1] + ','
        + this._values[2] + ']';
    },

    cLevels: function() { return 3; }
  }
);

c.SymbolicWeight.clsZero = new c.SymbolicWeight(0, 0, 0);

})(c);
