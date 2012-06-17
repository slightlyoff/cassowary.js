/**
 * Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
 * Use of this source code is governed by the LGPL, which can be found in the
 * COPYING.LGPL file.
 */

(function(scope) {
"use strict";

// TODO(slightlyoff):
//      * min* and max* properties need correctly weighted strengths.
//      * Make panels draggable as an option.
//      * Optional remove-animation property
//      * Child-panels. Mostly a question of what to generate in terms of own
//        CSS values (since our frame of reference is the parent and not the
//        root.
//      * Fix the hierarchy methods on the DOM prototypes so the whole thing
//        doesn't suck to work with.
//      * Move to using mutation observers for append child watching instead of
//        overriding.

var fireType = function(type) {
  return function() {
    var e = document.createEvent("UIEvents");
    e.initUIEvent(type, false, false, window, true);
    document.dispatchEvent(e);
  }
};

var fireSolved = fireType("solved");

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
  if (typeof l == "string") {
    if (l.charAt(0) == "#") {
      l = l.split(",");
      l.forEach(function(v, idx) {
        var items = v.split(".");
        l[idx] = document.querySelector(items.shift());
        while(items.length) {
          l[idx] = l[idx][items.shift()];
        }
      });
    } else if(l == "previous") {
      l = [ this.previousElementSibling ];
    } else if(l == "next") {
      l = [ this.nextElementSibling ];
    } else {
      l = [ document.querySelector(l) ];
    }
  }
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

var valueSetter = function(item, varOrValue, oper, strength, weight) {
  var slot = "_" + item;
  if (typeof varOrValue == "string") {
    if (typeof this[slot] == "boolean") {
      varOrValue = (varOrValue == "true");
    } else if (varOrValue == "inherit") {
      oper = "=";
      varOrValue = this.parentNode.v[item];
    } else if (varOrValue.charAt(0) == "#") {
      var items = varOrValue.split(".");
      var id = items.shift().slice(1);
      varOrValue = document.getElementById(id);
      if (!varOrValue) {
        console.log("couldn't find panel with ID:", id);
      }
      items.forEach(function(prop, idx) {
        varOrValue = varOrValue[prop];
      }, this);
    } else {
      varOrValue = parseInt(varOrValue, 10);
    }
  }
  this.remove(this[slot]);
  // FIXME(slightlyoff): what's the strength of these?
  if (oper && oper != "=") {
    if (oper == ">=") oper = c.GEQ;
    if (oper == "<=") oper = c.LEQ;
    // this[slot] = new c.LinearInequality(this.v[item], oper, varOrValue, strength||weak, weight||1);
    this[slot] = new c.LinearInequality(this.v[item], oper, varOrValue, strength);
  } else {
    // this[slot] = new c.LinearEquation(this.v[item], varOrValue, strength||weak, weight||1);
    this[slot] = new c.LinearEquation(this.v[item], varOrValue, strength);
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
var mediumStay =   function(v, w) { return stay(v, medium, w); };
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
      _movable: false,
      _moving: false,
      _moveStartLocation: {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
      },
      _moveHandlers: {
        mousedown: this._mouseDown.bind(this),
        mousemove: this._mouseMove.bind(this),
        mouseup:   this._mouseUp.bind(this),
        dragstart: function(e) { e.preventDefault(); },
      },

      _leftOf: [],
      _rightOf: [],
      _above: [],
      _below: [],
      _centeredIn: [],
      _avoid: [],
      constraints: [],

      v: {}, // Our variables
      panels: [], // Children

      _attached: false,
      // 'cause DOM events are fucking brain-dead
      _updateStyles: this._updateStyles.bind(this),
    });

    this.id = uniqueId(this);
    this._initConstraints();
    this.debug = this._debug;
    this._setProperties(props);
    this._initStyles();
  },

  tagName: "x-panel",

  get debug() {
    return this._debug;
  },

  set debug(v) {
    if (v && this._attached) {
      if (!this._debugShadow) {
        var ds = this._debugShadow = document.createElement("div");
        ds.id = "debug_shadow_for_" + this.id
        ds.classList.add("debugShadow");
        document.body.appendChild(ds);
        this._updateDebugShadow();
      }
    } else {
      if (this._debugShadow) {
        this._debugShadow.parentNode.removeChild(this._debugShadow);
        this._debugShadow = null;
      }
    }
    this._debug = v;
    // this.setAttribute("debug", v);
  },

  // FIXME(slightlyoff):
  //    coalesce event handlers to prevent all the registration duplication?
  get movable() {
    return this._movable;
  },

  set movable(v) {
    if (v && !this._movable) {
      // Set up drag handlers.
      c.own(this._moveHandlers, function(h) {
        var dh = this._moveHandlers[h];
        window.addEventListener(h, dh, false);
      }, this);
    } else if(!v && this._movable) {
      // Clobber existing move handlers
      c.own(this._moveHandlers, function(h) {
        var dh = this._moveHandlers[h];
        window.removeEventListener(h, dh, false);
      }, this);
    }
    this._movable = v;
    // this.setAttribute("movable", v);
  },

  _mouseDown: function(e) {
    // We're in absolute coordinate space, so we can use global location when
    // comparing offsets.
    if (e.target == this) {
      var start = this._moveStartLocation;
      start.x = e.pageX;
      start.y = e.pageY;
      start.left = this.v.left.value();
      start.top = this.v.top.value();
      s.addEditVar(this.v.left, strong)
       .addEditVar(this.v.top, strong).beginEdit();
      this._moving = true;
    }
  },

  _mouseUp: function(e) {
    if (this._moving) {
      var l = this.v.left.value();
      var t = this.v.top.value();
      s.endEdit();
      // Re-set the current value at the default strength (weak) instead of our
      // (strong) edit-time updates to it.
      this.left = l;
      this.top = t;
    }
    this._moving = false;
  },

  _mouseMove: function(e) {
    if (this._moving) {
      var start = this._moveStartLocation;
      var deltaX = e.pageX - start.x;
      var deltaY = e.pageY - start.y;

      s.suggestValue(this.v.left, start.left + deltaX)
       .suggestValue(this.v.top,  start.top + deltaY).resolve();
    }
  },

  _updateDebugShadow: function() {
    if (!this._debugShadow) { return; }

    var s = this.id + " dimensions:<br>";
    [ "width",
      "height",
      "left",
      "top" // , "right", "bottom"
    ].forEach(function(name) {
      var v = this.v[name].value() + "px";
      this._debugShadow.style[name] = v;
      s += name + ": " + v + "  <br>";
    }, this);

    [ "right",
      "bottom",
      "preferredWidth",
      "preferredHeight"
    ].forEach(function(name) {
      var v = this.v[name].value() + "px";
      s += name + ": " + this.v[name].value() + "px  <br>";
    }, this);

    this._debugShadow.innerHTML = s;
  },

  _setProperties: function(props) {
    // Grab the attributes we care about and parse/set
    var b = this.getAttribute("box");
    if (b) {
     this.box = JSON.parse(b);
    }

    var debug = this.getAttribute("debug");
    if (debug) {
      this.debug = (debug == "true");
    }

    var movable = this.getAttribute("movable");
    if (movable) {
      this.movable = (movable == "true");
    }


    [ "width",
      "minWidth",
      "maxWidth",
      "height",
      "minHeight",
      "maxHeight",
      "left",
      "top",
      "right",
      "bottom",
      "preferredWidth",
      "preferredHeight"
    ].concat(this._listConstraintNames)
     .forEach(function(prop) {
       var attr = this.getAttribute(prop);
       if (attr) { this[prop] = attr; }
     }, this);
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
    s.autoSolve = false;
    this.constraints.forEach(function(cns) { s.addConstraint(cns); });
    s.resolve();
    s.autoSolve = true;

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
    s.autoSolve = false;
    this.constraints.forEach(function(c) { s.removeConstraint(c); });
    s.resolve();
    s.autoSolve = true;

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

  _valueConstraintNames: [
    "width",
    "height",
    "left",
    "right",
    "top",
    "bottom",
    "contentWidth", "contentHeight",
    "contentLeft", "contentRight",
    "contentTop", "contentBottom",

    // preferred
    "preferredWidth",
    "preferredHeight",

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
  ],

  _listConstraintNames: [
    "above",
    "below",
    "leftOf",
    "rightOf"
  ],

  _initConstraints: function() {
    var Expr = c.LinearExpression;
    var Var = c.Variable;

    var v = this.v = {};

    this._valueConstraintNames.forEach(function(name) {
      v[name] = new Var(this.id + "_" + name);
    }, this);

    // Sanity
    this.constraints.push(
      // Positive values only for now
      geq(v.width,         0, required),
      geq(v.height,        0, required),
      geq(v.contentWidth,  0, required),
      geq(v.contentHeight, 0, required),

      leq(v.width,         v.preferredWidth, medium, 10),
      leq(v.height,        v.preferredHeight, medium, 10),

      geq(v.width,         v.minWidth, medium , 5),
      geq(v.height,        v.minHeight, medium, 5),
      geq(v.contentWidth,  v.minContentWidth, medium, 3),
      geq(v.contentHeight, v.minContentHeight, medium, 3),

      leq(v.width,         v.maxWidth, medium, 3),
      leq(v.height,        v.maxHeight, medium, 3),
      leq(v.contentWidth,  v.maxContentWidth, medium, 2),
      leq(v.contentHeight, v.maxContentHeight, medium, 2),

      // Total width is bigger than content width.
      geq(v.width,         v.contentWidth, medium, 1),
      geq(v.height,        v.contentHeight, medium, 1),

      // Bottom is at least top + height
      eq(v.bottom, c.Plus(v.top, v.height), medium, 10),
      // Right is at least left + width
      eq(v.right,  c.Plus(v.left, v.width), medium, 10)
    );
  },

  _updateStyles: function() {
    // NOTE: "bottom" and "right" are assumed to be computed
    [ "width", "height" ].forEach(function(name) {
      this.style[name] = this.v[name].value() + "px";
    }, this);

    // FIXME: caching? invalidation?
    [ "left", "top" ].forEach(function(name) {
      var v =  this.v[name].value();
      // If we're not direct children of the root, translate top/left to being
      // in the CSS "absolute" coordinate space from our absolutely positioned
      // parents
      if (this.parentNode && this.parentNode != document.body) {
        v = v - this.parentNode.v[name].value();
      }
      this.style[name] = v + "px";
    }, this);
    if (this._debugShadow) { this._updateDebugShadow(); }
  },

  _initStyles: function() { this.classList.add("panel"); },

  _panelOrVariable: function(arg, position) {
    return (arg instanceof Panel) ? arg.v[position]: arg;
  },

  add: function(/* c1, c2, ... */) {
    s.autoSolve = false;
    Array.prototype.slice.call(arguments).forEach(function(cns) {
      if (!cns) return;
      // FIXME(slightlyoff): should we try to prevent double-adding?
      this.constraints.push(cns);
      if (this._attached) { s.addConstraint(cns); }
    }, this);
    s.resolve();
    s.autoSolve = true;
    return this;
  },

  remove: function(/* c1, c2, ... */) {
    var al = arguments.length;
    if (!al) { return; }
    s.autoSolve = false;
    Array.prototype.slice.call(arguments).forEach(function(cns) {
      if (!cns) return;
      var ci = this.constraints.indexOf(cns);
      if (ci >= 0) {
        this.constraints.splice(ci, 1);
        if (this._attached) {
          s.removeConstraint(cns);
        }
      }
    }, this);
    s.resolve();
    s.autoSolve = true;
    return this;
  },

  replace: function(old, replacement) {
    this.remove(old);
    this.add(replacement);
    return this;
  },

  // Some layout helpers
  set above(l)   { listSetter.call(this, l, "above",   "bottom", "top",    c.LEQ, weak, 2); },
  set below(l)   { listSetter.call(this, l, "below",   "top",    "bottom", c.GEQ, weak, 2); },
  set leftOf(l)  { listSetter.call(this, l, "leftOf",  "right",  "left",   c.LEQ, weak, 2); },
  set rightOf(l) { listSetter.call(this, l, "rightOf", "left",   "right",  c.GEQ, weak, 2); },

  get above()    { return this._above; },
  get below()    { return this._below; },
  get leftOf()   { return this._leftOf; },
  get rightOf()  { return this._rightOf; },

  // FIXME(slightlyoff):
  //    need to add max* and min* versions of all of the below

  set top(v)    { valueSetter.call(this, "top",    v, "=", strong); },
  set bottom(v) { valueSetter.call(this, "bottom", v, "=", strong); },
  set left(v)   { valueSetter.call(this, "left",   v, "=", strong); },
  set right(v)  { valueSetter.call(this, "right",  v, "=", strong); },

  get top()     { return valueGetter.call(this, "top"); }, 
  get bottom()  { return valueGetter.call(this, "bottom"); },
  get left()    { return valueGetter.call(this, "left"); },
  get right()   { return valueGetter.call(this, "right"); },

  set width(v)  { valueSetter.call(this, "width", v); },
  set height(v) { valueSetter.call(this, "height", v); },

  get width()   { return valueGetter.call(this, "width"); },
  get height()  { return valueGetter.call(this, "width"); },

  set preferredWidth(v)  { valueSetter.call(this, "preferredWidth", v); },
  set preferredHeight(v) { valueSetter.call(this, "preferredHeight", v); },

  get preferredWidth()   { return valueGetter.call(this, "preferredWidth"); },
  get preferredHeight()  { return valueGetter.call(this, "preferredHeight"); },

  set minWidth(v)  { valueSetter.call(this, "minWidth", v); },
  set minHeight(v) { valueSetter.call(this, "minHeight", v); },

  get minWidth()   { return valueGetter.call(this, "minWidth"); },
  get minHeight()  { return valueGetter.call(this, "minHeight"); },

  set maxWidth(v)  { valueSetter.call(this, "maxWidth", v); },
  set maxHeight(v) { valueSetter.call(this, "maxHeight", v); },

  get maxWidth()   { return valueGetter.call(this, "maxWidth"); },
  get maxHeight()  { return valueGetter.call(this, "maxWHeight"); },

  set box(b) {
    this._valueConstraintNames.forEach(function(prop) {
        if (b.hasOwnProperty(prop)) { this[prop] = b[prop]; } }, this); 

    this._listConstraintNames.forEach(function(prop) {
        if (b.hasOwnProperty(prop)) { this[prop] = b[prop]; } }, this);
  },

  set centeredIn(other) {
    this.remove.apply(this, this._centeredIn);
    this._centeredIn = [
      // this.left = other.left + (other.width/2 - this.width/2)
      eq(this.v.left,
        c.Plus(other.v.left, 
          c.Minus(
            c.Divide(other.v.width, 2),
            c.Divide(this.v.width, 2)
          )
        ), medium, 2),

      // this.top = other.top + (other.height/2 - this.height/2)
      eq(this.v.top,
        c.Plus(other.v.top, 
          c.Minus(
            c.Divide(other.v.height, 2),
            c.Divide(this.v.height, 2)
          )
        ), medium, 2)
    ];

    this.add.apply(this, this._centeredIn);
    this._centeredIn.other = other;
  },
  get centeredIn() { return this._centeredIn.other; },

  /*
  set avoid(other) {
    this.remove.apply(this, this._avoid);
    this._avoid = [
    ];
    this.add.apply(this, this._avoid);
    this._avoid.other = other;
  },
  get avoid(other) { return this._avoid.other; },
  */
});

HTMLElement.register(Panel);

// We sould only ever have one of these per document, so enforce it losely and
// make sure that we set one up by default.
scope.RootPanel = c.inherit({
  extends: Panel,
  initialize: function() {
    if (document.rootPanel) { 
      throw "Attempting to create multiple roots on the same document!";
    }

    Panel.ctor.call(this);

    var iw = new c.Variable("window_innerWidth");
    var ih = new c.Variable("window_innerHeight");

    var s = document.solver;

    var widthEQ = eq(this.v.width, iw, medium, 5);
    var heightEQ = eq(this.v.height, ih, medium, 5);

    // At this point, we won't be attached but will have had our constraints
    // initialized. We clobber them and add our own.
    this.constraints = [ ];

    this.constraints.push(
      widthEQ,
      heightEQ,
      eq(this.v.top, 0, medium),
      eq(this.v.left, 0, medium),
      eq(this.v.bottom, c.Plus(this.v.top, this.v.height), medium, 2),
      // Right is at least left + width
      eq(this.v.right,  c.Plus(this.v.left, this.v.width), medium, 2),
      stay(this.v.right),
      stay(this.v.bottom)
    );

    // Propigate viewport size changes.
    var reCalc = function() {
      
      // Measurement should be cheap here.
      var iwv = window.innerWidth;
      var ihv = window.innerHeight;

      // console.time("resolve");

      s.addEditVar(iw)
       .addEditVar(ih).beginEdit();

      s.suggestValue(iw, iwv)
       .suggestValue(ih, ihv); // .resolve();

      s.endEdit();

      // console.timeEnd("resolve");

      if (iwv != this.v.width.value()) {
        // ZOMGWTFBBQ?
        console.log("width: suggested:", iwv, "got:", this.v.width.value());
        console.log("height: suggested:", ihv, "got:", this.v.height.value());
        console.log("right: suggested:", iwv, "got:", this.v.right.value());
        console.log("bottom: suggested:", ihv, "got:", this.v.bottom.value());
      }
    }.bind(this);

    var frame = 0;
    var resizeNextFrame = function() {
      var f = frame++;
      window.rAF(function() {
        if (f == frame-1) {
          reCalc();
        }
      });
    };

    resizeNextFrame();

    window.addEventListener("resize", resizeNextFrame, false);
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
    rp.id = rp.id || "root";
    scope.RootPanel.prototype.upgrade(rp);
    document.rootPanel = rp;
    rp.attach();
    fireSolved();
    rp._updateStyles();
    fireType("root")();
  }
};

if (document.readyState != "complete") {
  window.addEventListener("load", installRoot, false);
}

installRoot();
})(this);
