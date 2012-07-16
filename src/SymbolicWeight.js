// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.SymbolicWeight = c.inherit({
  initialize: function(w1, w2, w3) {
    this._values = new Array(w1, w2, w3);
    this._dc = 0;
    this.toDouble();
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
    return this._dc < c._dc;
  },
    
  lessThanOrEqual: function(c) {
    return this._dc <= c._dc;
  },

  equal: function(c) {
    return this._dc == c._dc;
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
    if (this._dc) { return this._dc; }
    var sum =  0;
    var factor = 1;
    var multiplier = 1000;
    for (var i = this._values.length - 1; i >= 0; --i) {
      sum += this._values[i] * factor;
      factor *= multiplier;
    }
    return this._dc = sum;
  },

  toString: function() { return '[' + this._values.join(',') + ']'; }
});

c.SymbolicWeight.clsZero = new c.SymbolicWeight(0, 0, 0);

})(c);
