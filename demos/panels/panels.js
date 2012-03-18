(function(scope) {
"use strict";

// TODO(slightlyoff):
//      * Turn off auto-solving and connect solving to document resize,
//        microtask end, etc.
//      * Set up document.body as some sort of "Root panel" on which to hang
//        most of this lifecycle driving behavior. Probably means over-riding
//        appendChild/removeChild for it, etc.
//      * min* and max* properties
//      * Make panels draggable to show edit vars at work
//      * Fix the hierarchy methods on the DOM prototypes so the whole thing
//        doesn't suck giant donkey balls to work with.

// requestAnimationFrame shimming.
// FIXME(slightlyoff): move to domutil.js?
var rAF = window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(callback) {
            window.setTimeout(callback, 1000 / 60);
          };

var fireSolved = function() {
  var e = document.createEvent("UIEvents");
  e.initUIEvent("solved", false, false, window, true);
  document.dispatchEvent(e);
};

// Create a global solver
var s = document.solver = c.extend(new c.SimplexSolver(), { onsolved: fireSolved });

var _idCounter = 0;
var _vendedIds = [];

var uniqueId = function(p) {
  if (p && p.id) {
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
    return new c.LinearInequality(this.v[own],
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
    this[slot] = new c.LinearInequality(this.v[item], oper, varOrValue);
  } else {
    this[slot] = new c.LinearEquation(this.v[item], varOrValue);
  }
  this.add(this[slot]);
};

var valueGetter = function(item) {
  if(!this["_" + item]) return; // undefined
  return this.v[item].value();
};

var weak = c.Strength.weak;
var medium = c.Strength.medium;
var strong = c.Strength.strong;
var required = c.Strength.required;

var eq  = function(a1, a2)     { return new c.LinearEquation(a1, a2); };
var neq = function(a1, a2, a3) { return new c.LinearInequality(a1, a2, a3); };
var geq = function(a1, a2) 	   { return new c.LinearInequality(a1, c.GEQ, a2); };
var leq = function(a1, a2) 	   { return new c.LinearInequality(a1, c.LEQ, a2); };

var stay = function(v, strength, weight) { 
  return new c.StayConstraint(v, strength || weak, weight || 1.0);
};
var strongStay =   function(v, w) { return stay(v, strong, w); };
var requiredStay = function(v, w) { return stay(v, required, w); }

var edit = function(v, strength, weight) { 
  return new c.EditConstraint(v, strength || weak, weight || 1.0);
};
var strongEdit =   function(v, w) { return edit(v, strong, w); };
var requiredEdit = function(v, w) { return edit(v, required, w); }

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

      _debug: false,

      _leftOf: [],
      _rightOf: [],
      _above: [],
      _below: [],
      constraints: [],

      v: {}, // Our variables
      panels: [], // Children

      _attached: false,
      // 'cause DOM events are fucking brain-dead
      _updateStyles: this._updateStyles.bind(this),
    });

    this._setProperties(props);
    this.id = uniqueId(this);
    this._initConstraints();
    this.debug = this._debug;
    this._initStyles();
  },

  get debug() {
    return this._debug;
  },

  set debug(v) {
    // console.log(this.id, "setting debug to:", v);
    if (v) {
      if (!this._debugShadow) {
        var ds = this._debugShadow = document.createElement("div");
        ds.id = "debug_shadow_for_" + this.id
        ds.classList.add("debugShadow");
        document.body.appendChild(ds);
        this._updateDebugShadow();
        // console.log("added debug shadow for", this.id);
      }
    } else {
      if (this._debug && !this._debugShadow) {
        // console.log("removed debug shadow for", this.id);
        this._debugShadow.parent.removeChild(this._debugShadow);
        this._debugShadow = null;
      }
    }
    this._debug = v;
  },

  _updateDebugShadow: function() {
    if (!this._debugShadow) { return; }
    var s = this.id + " dimensions:<br>";
    [
      "width", "height", "left", "right", "top", "bottom"
    ].forEach(function(name) {
      var v = this.v[name].value() + "px";
      this._debugShadow.style[name] = v;
      s += name + ": " + v + "  <br>";
    }, this);
    this._debugShadow.innerHTML = s;
  },

  _setProperties: function(props) {
    // TODO(slightlyoff)
  },

  //
  // Lifecycle methods and fixes
  //

  attach: function() {
    if (this._attached) { return this; }

    this._attached = true;

    this.panels.forEach(function(n) {
      if (n instanceof Panel) {
        var e = document.createEvent("UIEvents");
        e.initUIEvent("attach", false, false, window, true);
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
      e.initUIEvent("detach", false, false, window, true);
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
        // console.log("attaching:", n);
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

    var v = this.v = {};

    [ "width", "height",
      "left", "right",
      "top", "bottom",
      "contentWidth", "contentHeight",
      "contentLeft", "contentRight",
      "contentTop", "contentBottom"
    ].forEach(function(name) {
      v[name] = new Var(this.id + "_" + name);
    }, this);

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
      eq(v.bottom, c.Plus(v.top, v.height)),
      // Right is at least left + width
      eq(v.right,  c.Plus(v.left, v.width))
    );
  },

  _updateStyles: function() {
    // FIXME(slightlyoff):
    //  Dig our style values out of the variables and update our CSS
    //  accordingly.
    //
    // console.log("Updating styles for Panel:", this.id);

    [ "width", "height",
      "left", // "right",
      "top" //, "bottom"
    ].forEach(function(name) {
      this.style[name] = this.v[name].value() + "px";
    }, this);
    if (this._debugShadow) { this._updateDebugShadow(); }
  },

  _initStyles: function() { this.classList.add("panel"); },

  _panelOrVariable: function(arg, position) {
    return (arg instanceof Panel) ? arg.v[position]: arg;
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

  remove: function(/* c1, c2, ... */) {
    var al = arguments.length;
    if (!al) { return; }
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
      forEach(function(prop) {
        if (b[prop]) this[prop] = b[prop];
      }, this);
  },

  centerIn: function(panel) {
    // TODO(slightlyoff)
  },

});

// We sould only ever have one of these per document, so enforce it losely and
// make sure that we set one up by default.
scope.RootPanel = c.inherit({
  extends: Panel,
  initialize: function() {
    if (document.rootPanel) { 
      throw "Attempting to create multiple roots on the same document!";
    }

    Panel.ctor.call(this);

    // At this point, we won't be attached but will have had our constraints
    // initialized. We clobber them and add our own.
    this.constraints = [ ];

    var iw = window.innerWidth;
    var ih = window.innerHeight;


    this.constraints.push(
      requiredStay(this.v.top),
      requiredStay(this.v.left),
      requiredEdit(this.v.height),
      requiredEdit(this.v.width),
       eq(this.v.top,           0),
       eq(this.v.left,          0),
      geq(this.v.width,         0),
      geq(this.v.height,        0),
      geq(this.v.contentWidth,  0),
      geq(this.v.contentHeight, 0),
       eq(this.v.bottom, c.Plus(this.v.top, this.v.height)),
       // Right is at least left + width
       eq(this.v.right,  c.Plus(this.v.left, this.v.width))
    );
    console.log(this.constraints);

    var inFlight = [];

    // Propigate viewport size changes.
    window.addEventListener("resize", function() {
      // Measurement should be cheap here.
      inFlight.push(function() {
        var iw = window.innerWidth;
        var ih = window.innerHeight;
        // console.log(iw, "x", ih);

        // Time resolution
        console.time("resolve");

        var s = document.solver;
        var v = this.v;
        s.autoSolve = false;

        s.addEditVar(v.width)
         .addEditVar(v.height)
         .addEditVar(v.right)
         .addEditVar(v.bottom).beginEdit();
        s.beginEdit();

        s.suggestValue(v.width, iw);
        s.suggestValue(v.right, iw);
        s.suggestValue(v.height, ih);
        s.suggestValue(v.bottom, ih);

        s.resolve();
        s.autoSolve = true; // FIXME(slightlyoff): should we really do this?

        console.timeEnd("resolve");

        if (iw != this.v.width.value()) {
          // ZOMGWTFBBQ?
          console.log("width: suggested:", iw, "got:", this.v.width.value());
          console.log("height: suggested:", ih, "got:", this.v.height.value());
          console.log("right: suggested:", iw, "got:", this.v.right.value());
          console.log("bottom: suggested:", ih, "got:", this.v.bottom.value());
        }
      }.bind(this));

      rAF(function() {
        if(inFlight.length) { inFlight[inFlight.length-1](); }
        inFlight.length = 0;
      });
    }.bind(this));
  },

  _updateStyles: function() {
    // No-op for main styles since we're the thing that's the root of
    // measuremement in the first place.
    this._updateDebugShadow();
  },
});

// Install a root panel by default
var installRoot = function() {
  if (!document.rootPanel && document.body) {
    var rp = document.body;
    rp.id = "rootPanel";
    scope.RootPanel.prototype.upgrade(rp);
    document.rootPanel = rp;
    rp.attach();
    fireSolved();
    rp._updateStyles();
  }
};

if (document.readyState != "complete") {
  window.addEventListener("load", installRoot, false);
}

installRoot();

})(this);
