// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.Point = c.inherit({
  initialize: function(x, y, suffix) {
    if (x instanceof c._Variable) {
      this._x = x;
    } else {
      if (suffix) {
        this._x = new c._Variable("x"+suffix, x);
      } else {
        this._x = new c._Variable(x);
      }
    }
    if (y instanceof c._Variable) {
      this._y = y;
    } else {
      if (suffix) {
        this._y = new c._Variable("y"+suffix, y);
      } else {
        this._y = new c._Variable(y);
      }
    }
  },

  get x() { return this._x; },
  set x(x) {
    if (x instanceof c._Variable) {
      this._x = x;
    } else {
      this._x.value = x;
    }
  },

  get y() { return this._y; },
  set y(y) {
    if (y instanceof c._Variable) {
      this._y = y;
    } else {
      this._y.value = y;
    }
  },

  toString: function() {
    return "(" + this.x + ", " + this.y + ")";
  },
});

})(c);
