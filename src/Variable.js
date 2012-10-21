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

  _init: function(args, varNamePrefix) {
    // Common mixin initialization.
    this.hashCode = c._inc();
    this.name = (varNamePrefix||"") + this.hashCode;
    if (args) {
      if (typeof args.name != "undefined") {
        this.name = args.name;
      }
      if (typeof args.value != "undefined") {
        this.value = args.value;
      }
      if (typeof args.prefix != "undefined") {
        this._prefix = args.prefix;
      }
    }
  },

  _prefix: "",
  name: "",
  value: 0,

  toString: function() {
    return this._prefix + "[" + this.name + ":" + this.value + "]";
  },
});

c._Variable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, value) {
    this.name = "";
    this.value = 0;
    this.hashCode = c._inc();

    if (typeof name_or_val == "string") {
      var a1t = typeof name_or_val;
      if (a1t == "string" || a1t != "undefined") {
        this.name = name_or_val || "v" + this.hashCode;
      } else {
        this.name = name_or_val + value;
      }
      this.value = value || 0;
    } else {
      if (typeof name_or_val == "number") {
        this.value = name_or_val;
      }
    }
    // FIXME: gigantic memory leak?
    var vm = c._Variable._map;
    if (vm && this.name) { vm[this.name] = this; }
  },
  isExternal:     true,
});

c.Variable = c.inherit({
  // extends: c.AbstractVariable,
  extends: c._Variable,
  initialize: function(args) {
    this._init(args, "v");
    var vm = c._Variable._map;
    if (vm) { vm[this.name] = this; }
  },
  isExternal:     true,
});

/* static */
// c.Variable._map = [];
// c._Variable._map = [];

c.DummyVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "d");
  },
  isDummy:        true,
  isRestricted:   true,
  value:         "dummy",
});

c.ObjectiveVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "o");
  },
  value:         "obj",
});

c.SlackVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(args) {
    this._init(args, "s");
  },
  isPivotable:    true,
  isRestricted:   true,
  value:         "slack",
});

})(c);
