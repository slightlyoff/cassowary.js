(function(scope) {
"use strict";

// TODO(slightlyoff):
//      * Turn off auto-solving and connect solving to document resize,
//        microtask end, etc.
//      * Set up document.body as some sort of "Root panel" on which to hang
//        most of this lifecycle driving behavior. Probably means over-riding
//        appendChild/removeChild for it, etc.


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

var panelOrVariable = function(arg) {
  return (arg instanceof Panel) ? arg.vars.bottom : arg;
}

// Global
scope.Panel = c.inherit({
  extends: HTMLDivElement,

  //
  // Ctor
  //

  initialize: function(props) {
    // Instance data property defaults.
    c.extend(this, {
      constraints: [],
      vars: {},
      panels: [],
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
    this.constraints.forEach(function(c) {
      document.solver.addConstraint(c);
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

  _initStyles: function() {
    this.classList.add("panel");
  },

  // Some layout helpers
  set above: function(arg) {
    this.constraints.push(
      new c.LinearEquation(this.vars.bottom, panelOrVariable(arg))
    );
  },

  set below: function(panelOrVar) {
    this.constraints.push(
      new c.LinearEquation(this.vars.top, panelOrVariable(arg))
    );
  },

  set leftOf: function(panelOrVar) {
    this.constraints.push(
      new c.LinearEquation(this.vars.right, panelOrVariable(arg))
    );
  },

  set rightOf: function(panelOrVar) {
    this.constraints.push(
      new c.LinearEquation(this.vars.left, panelOrVariable(arg))
    );
  },

  set top: function() {
  },

  set left: function() {
  },

  set right: function() {
  },

  set bottom: function() {
  },

  set box: function(box) {
    if (box.left) this.left = box.left;
    if (box.right) this.right = box.right;
    if (box.top) this.top = box.top;
    if (box.bottom) this.bottom = box.bottom;
  }
});

})(this);
