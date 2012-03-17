(function(scope) {
"use strict";

// TODO(slightlyoff):
//      * Turn off auto-solving and connect solving to document resize,
//        microtask end, etc.
//      * Set up document.body as some sort of "Root panel" on which to hang
//        most of this lifecycle driving behavior. Probably means over-riding
//        appendChild/removeChild for it, etc.
//      * min* and max* properties


// Create a global solver
var s = document.solver = c.extend(new c.SimplexSolver(), {
  onsolved: function() {
    // console.log("Solved:", s);

    // When we have a solution, dispatch an event.
    var e = document.createEvent("UIEvents");
    e.initUIEvent("solved", false, false, window);
    document.dispatchEvent(e);
  },
});

var _idCounter = 0;
var _vendedIds = [];
var uniqueId = function(p) {
  if (p && typeof p["id"] != "undefined") {
    return p.id;
  } else {
    var tid = "Panel_" + _idCounter++;
    while (_vendedIds.indexOf(tid) >= 0) {
      tid = "Panel_" + _idCounter++;
    }
    _vendedIds.push(tid);
    return tid;
  }
};

var toArray = function(a) {
  return Array.isArray(a) ? a : Array.prototype.slice.call(arguments);
};

var listSetter = function(l, name, own, relativeTo, oper) {
  var ln = "_" + name;
  this.remove.apply(this, this[ln]);
  this[ln] = toArray(l).map(function(v) {
    return new c.LinearInequality(this.vars[own],
                                  oper,
                                  this._panelOrVariable(v, relativeTo));
  }, this);
  this.add.apply(this, this[ln]);
};

var valueSetter = function(item, varOrValue, oper) {
  var slot = "_" + item;
  this.remove(this[slot]);
  // FIXME(slightlyoff): what's the strength of these?
  if (oper && oper != "=") {
    if (oper == ">=") oper = c.GEQ;
    if (oper == "<=") oper = c.LEQ;
    this[slot] = new c.LinearInequality(this.vars[item], oper, varOrValue);
  } else {
    this[slot] = new c.LinearEquation(this.vars[item], varOrValue);
  }
  this.add(this[slot]);
};

var valueGetter = function(item) {
  if(!this["_" + item]) return; // undefined
  return this.vars[item].value();
};

// Global
scope.Panel = c.inherit({
  extends: HTMLDivElement,

  //
  // Ctor
  //

  initialize: function(props) {
    // Instance data property defaults.
    c.extend(this, {
      // Storage slots for our various relationship constraints
      _left: null,
      _right: null,
      _top: null,
      _bottom: null,

      _leftOf: [],
      _rightOf: [],
      _above: [],
      _below: [],
      constraints: [],

      vars: {},
      panels: [], // Children

      _attached: false,
      // 'cause DOM events are fucking brain-dead
      _updateStyles: this._updateStyles.bind(this),
    });

    this._setProperties(props);
    this.id = uniqueId(this);
    this._initConstraints();
    this._initStyles();
  },

  _setProperties: function(props) {
    // TODO(slightlyoff)
  },

  //
  // Lifecycle methods and fixes
  //

  attach: function() {
    if (this._attached ||
        !this.parentNode // A tiny bit of sanity
    ) {
      return this;
    }

    this._attached = true;

    this.panels.forEach(function(n) {
      if (n instanceof Panel) {
        var e = document.createEvent("UIEvents");
        e.initUIEvent("attach", false, false, window);
        if (n.onattach) { n.onattach(e); } // DOM 0
        n.dispatchEvent(e);                // DOM 2+
      }
    });

    // We add our constraints to the solver ONLY when we're 
    this.constraints.forEach(function(cns) {
      document.solver.addConstraint(cns);
    });

    // FIXME(slightlyoff):
    //  Connect to the solver's completion here and set style properties in
    //  response.
    document.addEventListener("solved", this._updateStyles, false);
    return this;
  },

  detach: function() {
    this._attached = false;

    this.panels.forEach(function(n) {
      var e = document.createEvent("UIEvents");
      e.initUIEvent("detach", false, false, window);
      if (n.ondetach) { n.ondetach(e); } // DOM 0
      n.dispatchEvent(e);                // DOM 2+
    });

    // Remove our constraints from the solver
    this.constraints.forEach(function(c) {
      document.solver.removeConstraint(c);
    });

    document.removeEventListener("solved", this._updateStyles, false);
    return this;
  },

  // If it's a panel that we're adding or removing, send the
  // attatched/detatched events
  appendChild: function(n) {
    if (n instanceof Panel) {
      if (!n.parentNode || n.parentNode != this) {
        this.panels.push(n);
      }
      if (this._attached) {
        n.attach();
      }
    }

    return HTMLDivElement.prototype.appendChild.call(this, n);
  },

  removeChild: function(n) {
    if (n instanceof Panel) {
      n.detach();
      var i = this.panels.indexOf(n);
      if (i >= 0) {
        this.panels.splice(i, 1);
      }
    }
    return HTMLDivElement.prototype.appendChild.call(this, n);
  },

  _initConstraints: function() {
    var Expr = c.LinearExpression;
    var Var = c.Variable;
    var neq = function(a1, a2, a3) {
      return new c.LinearInequality(a1, a2, a3);
    };
    var geq = function(a1, a2) {
      return new c.LinearInequality(a1, c.GEQ, a2);
    };
    var v = this.vars = {};
    [ "width", "height", "left", "right", "top", "bottom",
      "contentWidth", "contentHeight",
      "contentLeft", "contentRight",
      "contentTop", "contentBottom"
    ].forEach(function(name) { v[name] = new Var(this.id + "_" + name); }, this);

    // Sanity
    this.constraints.push(
      // Positive values only for now
      geq(v.width,         0),
      geq(v.height,        0),
      geq(v.contentWidth,  0),
      geq(v.contentHeight, 0),

      // Total width is bigger than content width.
      geq(v.width,         v.contentWidth),
      geq(v.height,        v.contentHeight),

      // Bottom is at least top + height
      geq(v.bottom,         c.Plus(v.top, v.height)),
      // Right is at least left + width
      geq(v.right,          c.Plus(v.left, v.width))
    );
  },

  _updateStyles: function() {
    // FIXME(slightlyoff):
    //  Dig our style values out of the variables and update our CSS
    //  accordingly.
    //
    // console.log("Updating styles for Panel:", this.id);
    //
    [
      "width", "height",
      "left", "right",
      "top", "bottom"
    ].forEach(function(n) {
      // console.log("setting", n, "to", this.vars[n].value());
      this.style[n] = this.vars[n].value() + "px";
    }, this);
  },

  _initStyles: function() { this.classList.add("panel"); },

  _panelOrVariable: function(arg, position) {
    return (arg instanceof Panel) ? arg.vars[position]: arg;
  },

  add: function(/* c1, c2, ... */) {
    Array.prototype.slice.call(arguments).forEach(function(cns) {
      if (!cns) return;
      // FIXME(slightlyoff): should we try to prevent double-adding?
      this.constraints.push(cns);
      if (this._attached) {
        // FIXME(slightlyoff):
        //    when we turn off auto-solving, update this to mark us unsolved.
        document.solver.addConstraint(cns);
      }
    }, this);
    return this;
  },

  remove: function(constraints) {
    Array.prototype.slice.call(arguments).forEach(function(cns) {
      if (!cns) return;
      var ci = this.constraints.indexOf(cns);
      if (ci >= 0) {
        this.constraints.splice(ci, 1);
        if (this._attached) {
          // FIXME(slightlyoff):
          //    when we turn off auto-solving, update this to mark us unsolved.
          document.solver.removeConstraint(cns);
        }
      }
    }, this);
    return this;
  },

  replace: function(old, replacement) {
    this.remove(old);
    this.add(replacement);
    return this;
  },

  // Some layout helpers
  set above(l)   { listSetter.call(this, l, "above",   "bottom", "top",    c.LEQ); },
  set below(l)   { listSetter.call(this, l, "below",   "top",    "bottom", c.GEQ); },
  set leftOf(l)  { listSetter.call(this, l, "leftOf",  "right",  "left",   c.LEQ); },
  set rightOf(l) { listSetter.call(this, l, "rightOf", "left",   "right",  c.GEQ); },

  get above()    { return this._above; },
  get below()    { return this._below; },
  get leftOf()   { return this._leftOf; },
  get rightOf()  { return this._rightOf; },

  // FIXME(slightlyoff):
  //    need to add max* and min* versions of all of the below

  set top(v)    { valueSetter.call(this, "top", v);    }, 
  set bottom(v) { valueSetter.call(this, "bottom", v); },
  set left(v)   { valueSetter.call(this, "left", v);   },
  set right(v)  { valueSetter.call(this, "right", v);  },

  get top()     { return valueGetter.call(this, "top"); }, 
  get bottom()  { return valueGetter.call(this, "bottom"); },
  get left()    { return valueGetter.call(this, "left"); },
  get right()   { return valueGetter.call(this, "right"); },

  set width(v)  { valueSetter.call(this, "width", v); },
  set height(v) { valueSetter.call(this, "height", v); },

  get width()   { return valueGetter.call(this, "width"); },
  get height()  { return valueGetter.call(this, "width"); },

  set box(b) {
    [ "left", "right", "top", "bottom", "width", "height" ].
      forEach(
          function(prop) { if (b[prop]) this[prop] = b[prop]; },
          this
      );
  },

  centerIn: function(panel) {
    // TODO(slightlyoff)
  },
});

})(this);
