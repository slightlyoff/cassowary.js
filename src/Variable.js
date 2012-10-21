// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

var av =
c.AbstractVariable = c.inherit({
  initialize: function(a1, a2) {
    this._name = "";
    this.hash_code = c._inc();

    var a1t = typeof a1;
    if (a1t == "string" || a1t != "undefined") {
      this._name = a1 || "v" + this.hash_code;
    } else {
      this._name = a1 + a2;
    }
  },

  get hashCode() { return this.hash_code; },

  isDummy:      false,
  isExternal:   false,
  isPivotable:  false,
  isRestricted: false,

  _value: "",
  _prefix: "",

  toString: function() {
    return this._prefix + "[" + this._name + ":" + this._value + "]";
  },
});

c._Variable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, value) {
    if (typeof name_or_val == "string") {
      av.call(this, name_or_val);
      this._value = value || 0;
    } else {
      av.call(this);
      if (typeof name_or_val == "number") {
        this._value = name_or_val;
      }
    }
    // FIXME: gigantic memory leak?
    var vm = c._Variable._map;
    if (vm) { vm[this._name] = this; }
  },
  isExternal:     true,
  get value() { return this._value; },
});

/* static */
// c.Variable._map = [];

c.DummyVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    av.call(this, name_or_val);
    if (prefix) { this._prefix = prefix; }
  },
  isDummy:        true,
  isRestricted:   true,
  _value:         "dummy",
});

c.ObjectiveVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    av.call(this, name_or_val);
    if (prefix) { this._prefix = prefix; }
  },
  _value:         "obj",
});

c.SlackVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    av.call(this, name_or_val);
    if (prefix) { this._prefix = prefix; }
  },
  isPivotable:    true,
  isRestricted:   true,
  _value:         "slack",
});

})(c);
