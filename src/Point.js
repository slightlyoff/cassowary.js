// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

// FIXME(slightlyoff):
//      Half of this file could removed with judicious use of getters/setters
//      if we can get the perf in the right neighborhood.

c.Point = c.inherit({
  initialize: function(x, y, suffix) {
    if (x instanceof c.Variable) {
      this.x = x;
    } else {
      if (suffix != null) {
        this.x = new c.Variable("x"+suffix, x);
      } else {
        this.x = new c.Variable(x);
      }
    }
    if (y instanceof c.Variable) {
      this.y = y;
    } else {
      if (suffix != null) {
        this.y = new c.Variable("y"+suffix, y);
      } else {
        this.y = new c.Variable(y);
      }
    }
  },
  SetXY: function(x, y) {
    if (x instanceof c.Variable) {
      this.x = x;
    } else {
      this.x._value = x;
    }
    if (y instanceof c.Variable) {
      this.y = y;
    } else {
      this.y._value = y;
    }
  },

  X: function() { return this.x; },

  Y: function() { return this.y; },

  Xvalue: function() {
    return this.x.value;
  },

  Yvalue: function() {
    return this.y.value;
  },

  toString: function() {
    return "(" + this.x + ", " + this.y + ")";
  },
});

})(c);
