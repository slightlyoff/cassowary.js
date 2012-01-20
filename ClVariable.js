// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

(function(c) {

var inc = (function(c){
  return function() { return c++; };
})(0);

var av = 
c.AbstractVariable = c.inherit({
  initialize: function(a1,a2) {
    this.hash_code = inc();
    if (typeof(a1) == "string" || (a1 == null)) {
      this._name = a1 || "v" + this.hash_code;
    } else {
      var varnumber = a1, prefix = a2;
      this._name = prefix + varnumber;
    }
  },

  hashCode: function() {
    // return "[v:" + this.hash_code + "]";
    return this.hash_code;
  },
  
  isDummy: false,
  /*
  isExternal: function() { throw "abstract isExternal"; },
  isPivotable: function() { throw "abstract isPivotable"; },
  isRestricted: function() { throw "abstract isRestricted"; },
  */
  isExternal: false, isPivotable: false, isRestricted: false,

  toString: function() {
    return "ABSTRACT[" + this._name + "]";
  }
});

c.Variable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, value) {
    this.hash_code = inc();
    this._name = "";
    this._value = 0.0;
    if (typeof(name_or_val) == "string") {
      av.call(this, name_or_val);
      this._value = value || 0.0;
    } else {
      av.call(this);
      if (typeof(name_or_val) == "number") {
        this._value = name_or_val;
      }
    }
    if (c.Variable._map) {
      c.Variable._map[this._name] = this;
    }
  },
  isDummy:        false,
  isExternal:     true,
  isPivotable:    false,
  isRestricted:   false,

  toString: function() {
    return "[" + this._name + ":" + this._value + "]";
  },

  // FIXME(slightlyoff)
  value: function() { return this._value; },
  set_value: function(value) { this._value = value; },
  change_value: function(value) { this._value = value; },
  setAttachedObject: function(o) { this._attachedObject = o; },
  getAttachedObject: function() { return this._attachedObject; },
});

/* static */
c.Variable._map = [];

c.DummyVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    av.call(this, name_or_val, prefix);
  },
  isDummy:        true,
  isPivotable:    false,
  isExternal:     false,
  isRestricted:   true,
  toString: function() { return "[" + this._name + ":dummy]"; },
});

c.ObjectiveVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    c.AbstractVariable.call(this, name_or_val, prefix);
  },
  isDummy:        false,
  isExternal:     false,
  isPivotable:    false,
  isRestricted:   false,

  toString: function() {
    return "[" + this._name + ":obj]";
  },
});

c.SlackVariable = c.inherit({
  extends: c.AbstractVariable,
  initialize: function(name_or_val, prefix) {
    c.AbstractVariable.call(this, name_or_val, prefix);
  },
  isDummy:        false,
  isExternal:     false,
  isPivotable:    true,
  isRestricted:   true,

  toString: function() {
    return "[" + this._name + ":slack]";
  },
});

})(CL);
