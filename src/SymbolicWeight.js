// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

(function(c) {

c.SymbolicWeight = c.inherit({
  initialize: function(w1, w2, w3) {
    this._values = new Array(w1, w2, w3);
  },

  times: function(n) {
    var v = this._values;
    return new c.SymbolicWeight(v[0] * n,
                                v[1] * n,
                                v[2] * n);
  },

  divideBy: function(n) {
    var v = this._values;
    return new c.SymbolicWeight(v[0] / n,
                                v[1] / n,
                                v[2] / n);
  },

  add: function(w) {
    var v = this._values;
    var wv = w._values;
    return new c.SymbolicWeight(v[0] + wv[0],
                                v[1] + wv[1],
                                v[2] + wv[2]);
  },

  subtract: function(w) {
    var v = this._values;
    var wv = w._values;
    return new c.SymbolicWeight(v[0] - wv[0],
                                v[1] - wv[1],
                                v[2] - wv[2]);
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
});

c.SymbolicWeight.clsZero = new c.SymbolicWeight(0, 0, 0);

})(c);
