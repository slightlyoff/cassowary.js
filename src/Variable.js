// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

var av =
c.AbstractVariable = c.inherit({
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

c.Variable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._value = 0;
    /*
    this._name = "";
    this.hashCode = c._inc();
    */
    if (args) {
      if (typeof args.name != "undefined") {
      }
    }
  },
  isExternal:     true,
  get value() { return this._value; },
});

c._Variable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, value) {
    this._name = "";
    this._value = 0;
    this.hashCode = c._inc();

    if (typeof name_or_val == "string") {
      var a1t = typeof name_or_val;
      if (a1t == "string" || a1t != "undefined") {
        this._name = name_or_val || "v" + this.hashCode;
      } else {
        this._name = name_or_val + value;
      }
      this._value = value || 0;
    } else {
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
    this.hashCode = c._inc();
    this._name = name_or_val || "v" + this.hashCode;
    this._prefix = (prefix) ? prefix : "";
  },
  isDummy:        true,
  isRestricted:   true,
  _value:         "dummy",
});

c.ObjectiveVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    this.hashCode = c._inc();
    this._name = name_or_val || "v" + this.hashCode;
    this._prefix = (prefix) ? prefix : "";
  },
  _value:         "obj",
});

c.SlackVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    this.hashCode = c._inc();
    this._name = name_or_val || "v" + this.hashCode;
    this._prefix = (prefix) ? prefix : "";
  },
  isPivotable:    true,
  isRestricted:   true,
  _value:         "slack",
});

})(c);
