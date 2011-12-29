(function(c) {

var varCount = 1;

var av = 
c.AbstractVariable = c.inherit({
  initialize: function(a1,a2) {
    this.hash_code = varCount++;
    if (typeof(a1) == "string" || (a1 == null)) {
      this._name = a1 || "v" + this.hash_code;
    } else {
      var varnumber = a1, prefix = a2;
      this._name = prefix + varnumber;
    }
  },

  hashCode: function() {
    return this.hash_code;
  },
  
  name: function() {
    return this._name;
  },

  setName: function(name) {
    this._name = name;
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
    return "[" + this.name() + ":" + this._value + "]";
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
  toString: function() { return "[" + this.name() + ":dummy]"; },
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
    return "[" + this.name() + ":obj]";
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
    return "[" + this.name() + ":slack]";
  },
});

})(CL);
