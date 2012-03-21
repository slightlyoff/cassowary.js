(function(scope) {
"use strict";

// TODO(slightlyoff):
//      * min* and max* properties need correctly weighted strengths.
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

var listSetter = function(l, name, own, relativeTo, oper, strength, weight) {
  var ln = "_" + name;
  this.remove.apply(this, this[ln]);
  this[ln] = toArray(l).map(function(v) {
    return new c.LinearInequality(this.v[own],
                                  oper,
                                  this._panelOrVariable(v, relativeTo),
                                  strength||weak,
                                  weight);
  }, this);
  this.add.apply(this, this[ln]);
};

var valueSetter = function(item, varOrValue, oper) {
  var slot = "_" + item;
  this.remove(this[slot]);
  if (typeof varOrvalue == "string") {
    varOrvalue = parseInt(varOrvalue, 10);
  }
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

var eq  = function(a1, a2, strength, w) {
  return new c.LinearEquation(a1, a2, strength || weak, w||0);
};
var neq = function(a1, a2, a3) { return new c.LinearInequality(a1, a2, a3); };
var geq = function(a1, a2, str, w) { return new c.LinearInequality(a1, c.GEQ, a2, str, w); };
var leq = function(a1, a2, str, w) { return new c.LinearInequality(a1, c.LEQ, a2, str, w); };

var stay = function(v, strength, weight) { 
  return new c.StayConstraint(v, strength || weak, weight || 1.0);
};
var weakStay =   function(v, w) { return stay(v, weak, w); };
var strongStay =   function(v, w) { return stay(v, strong, w); };
var requiredStay = function(v, w) { return stay(v, required, w); }


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

  tagName: "x-panel",

  get debug() {
    return this._debug;
  },

  set debug(v) {
    // console.log(this.id, "setting debug to:", v);
    if (v && this._attached) {
      if (!this._debugShadow) {
        var ds = this._debugShadow = document.createElement("div");
        ds.id = "debug_shadow_for_" + this.id
        ds.classList.add("debugShadow");
        document.body.appendChild(ds);
        this._updateDebugShadow();
        // console.log("added debug shadow for", this.id);
      }
    } else {
      if (this._debugShadow) {
        // console.log("removed debug shadow for", this.id);
        this._debugShadow.parentNode.removeChild(this._debugShadow);
        this._debugShadow = null;
      }
    }
    this._debug = v;
  },

  _updateDebugShadow: function() {
    if (!this._debugShadow) { return; }

    var s = this.id + " dimensions:<br>";
    [
      "width", "height", "left", "top" // , "right", "bottom"
    ].forEach(function(name) {
      var v = this.v[name].value() + "px";
      this._debugShadow.style[name] = v;
      s += name + ": " + v + "  <br>";
    }, this);

    [ "right", "bottom" ].forEach(function(name) {
      var v = this.v[name].value() + "px";
      s += name + ": " + this.v[name].value() + "px  <br>";
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

    this.debug = this.debug;

    this._updateStyles();

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

    this.debug = this.debug;

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

    return HTMLElement.prototype.appendChild.call(this, n);
  },

  removeChild: function(n) {
    if (n instanceof Panel) {
      n.detach();
      var i = this.panels.indexOf(n);
      if (i >= 0) {
        this.panels.splice(i, 1);
      }
    }

    return HTMLElement.prototype.removeChild.call(this, n);
  },

  _initConstraints: function() {
    var Expr = c.LinearExpression;
    var Var = c.Variable;

    var v = this.v = {};

    [
      "width", "height",
      "left", "right",
      "top", "bottom",
      "contentWidth", "contentHeight",
      "contentLeft", "contentRight",
      "contentTop", "contentBottom",

      // min
      "minWidth",
      "minHeight",
      "minLeft",
      "minRight",
      "minTop",
      "minBottom",
      "minContentWidth",
      "minContentHeight",
      "minContentLeft",
      "minContentRight",
      "minContentTop",
      "minContentBottom",

      // max
      "maxWidth",
      "maxHeight",
      "maxLeft",
      "maxRight",
      "maxTop",
      "maxBottom",
      "maxContentWidth",
      "maxContentHeight",
      "maxContentLeft",
      "maxContentRight",
      "maxContentTop",
      "maxContentBottom"

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

      geq(v.width,         v.minWidth, medium, 1000),
      geq(v.height,        v.minHeight, medium, 1000),
      geq(v.contentWidth,  v.minContetnWidth, medium, 1000),
      geq(v.contentHeight, v.minContentHeight, medium, 1000),

      leq(v.width,         v.maxWidth, medium, 10),
      leq(v.height,        v.maxHeight, medium, 10),
      leq(v.contentWidth,  v.maxContetnWidth, medium, 10),
      leq(v.contentHeight, v.maxContentHeight, medium, 10),

      // Total width is bigger than content width.
      geq(v.width,         v.contentWidth, medium, 10000),
      geq(v.height,        v.contentHeight, medium, 10000),

      // Bottom is at least top + height
      eq(v.bottom, c.Plus(v.top, v.height), medium, 1),
      // Right is at least left + width
      eq(v.right,  c.Plus(v.left, v.width), medium, 1)
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

  set minWidth(v)  { valueSetter.call(this, "minWidth", v); },
  set minHeight(v) { valueSetter.call(this, "minHeight", v); },

  get minWidth()   { return valueGetter.call(this, "minWidth"); },
  get minHeight()  { return valueGetter.call(this, "minHeight"); },

  set maxWidth(v)  { valueSetter.call(this, "maxWidth", v); },
  set maxHeight(v) { valueSetter.call(this, "maxHeight", v); },

  get maxWidth()   { return valueGetter.call(this, "maxWidth"); },
  get maxHeight()  { return valueGetter.call(this, "maxWHeight"); },

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

    var iw = new c.Variable("window_innerWidth", window.innerWidth);
    var ih = new c.Variable("window_innerHeight", window.innerHeight);

    var s = document.solver;
    s.addEditVar(iw);
    s.addEditVar(ih);

    var widthEQ = eq(this.v.width, iw, required);
    var heightEQ = eq(this.v.height, ih, required);

    // At this point, we won't be attached but will have had our constraints
    // initialized. We clobber them and add our own.
    this.constraints = [ ];

    this.constraints.push(
      widthEQ,
      heightEQ,
      eq(this.v.top, 0, required, 1000),
      eq(this.v.left, 0, required, 1000),
      eq(this.v.bottom, c.Plus(this.v.top, this.v.height), required, 1000),
      // Right is at least left + width
      eq(this.v.right,  c.Plus(this.v.left, this.v.width), required, 1000)
    );

    var caclulating = false;

    // Propigate viewport size changes.
    var reCalc = function() {
      if(caclulating) return;
      
      // Measurement should be cheap here.
      var iwv = window.innerWidth;
      var ihv = window.innerHeight;

      // Time resolution
      // console.time("resolve");

      // s.beginEdit();
      s.suggestValue(iw, iwv)
       .suggestValue(ih, ihv);
      s.resolve();
      // s.endEdit();

      // console.timeEnd("resolve");

      if (iwv != this.v.width.value()) {
        // ZOMGWTFBBQ?
        console.log("width: suggested:", iwv, "got:", this.v.width.value());
        console.log("height: suggested:", ihv, "got:", this.v.height.value());
        console.log("right: suggested:", iwv, "got:", this.v.right.value());
        console.log("bottom: suggested:", ihv, "got:", this.v.bottom.value());
      }

      caclulating = false;
    }.bind(this);

    window.addEventListener("resize", reCalc, false);
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
