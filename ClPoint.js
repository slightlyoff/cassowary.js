// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

(function(c) {

c.Point = c.inherit(
  function(x, y, suffix) {
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
  null,
  {
    SetXY: function(x, y) {
      if (x instanceof c.Variable) {
        this.x = x;
      } else {
        this.x.set_value(x);
      }
      if (y instanceof c.Variable) {
        this.y = y;
      } else {
        this.y.set_value(y);
      }
    },

    X: function() { return this.x; },

    Y: function() { return this.y; },

    Xvalue: function() {
      return this.x.value();
    },

    Yvalue: function() {
      return this.y.value();
    },

    toString: function() {
      return "(" + this.x + ", " + this.y + ")";
    },
  }
);

})(CL);
