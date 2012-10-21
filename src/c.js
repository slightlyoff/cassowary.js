// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(scope){
"use strict";

// For Safari 5.x. Go-go-gadget ridiculously long release cycle!
try {
  (function(){}).bind(scope);
} catch (e) {
  Object.defineProperty(Function.prototype, "bind", {
    value: function(scope) {
      var f = this;
      return function() { return f.apply(scope, arguments); }
    },
    enumerable: false,
    configurable: true,
    writable: true,
  });
}

var inBrowser = (typeof scope["HTMLElement"] != "undefined");

var getTagName = function(proto) {
  var tn = null;
  while (proto && proto != Object.prototype) {
    if (proto.tagName) {
      tn = proto.tagName;
      break;
    }
    proto = proto.prototype;
  }
  return tn || "div";
};
var epsilon = 1e-8;

// Global
scope.c = {
  //
  // Configuration
  //
  debug: false,
  trace: false,
  verbose: false,
  traceAdded: false,
  GC: false,

  //
  // Constants
  //
  GEQ: 1,
  LEQ: 2,

  //
  // Utility methods
  //
  inherit: function(props) {
    var ctor = null;
    var parent = null

    if (props["extends"]) {
      parent = props["extends"];
      delete props["extends"];
    }

    if (props["initialize"]) {
      ctor = props["initialize"];
      delete props["initialize"];
    }

    var realCtor = ctor || function() { };

    /*
    // NOTE: would happily do this except it's 2x slower. Boo!
    props.__proto__ = parent ? parent.prototype : Object.prototype;
    realCtor.prototype = props;
    */

    var rp = realCtor.prototype = Object.create(
      ((parent) ? parent.prototype : Object.prototype)
    );

    this.extend(rp, props);

    // If we're in a browser, we want to support "subclassing" HTML elements.
    // This needs some magic and we rely on a wrapped constructor hack to make
    // it happen.
    if (inBrowser) {
      if (parent && parent.prototype instanceof scope.HTMLElement) {
        var intermediateCtor = realCtor;
        var tn = getTagName(rp);
        var upgrade = function(el) {
          el.__proto__ = rp;
          intermediateCtor.apply(el, arguments);
          if (rp["created"]) { el.created(); }
          if (rp["decorate"]) { el.decorate(); }
          return el;
        };
        this.extend(rp, { upgrade: upgrade, });

        realCtor = function() {
          // We hack the constructor to always return an element with it's
          // prototype wired to ours. Boo.
          return upgrade(
            scope.document.createElement(tn)
          );
        }
        realCtor.prototype = rp;
        this.extend(realCtor, { ctor: intermediateCtor, }); // HACK!!!
      }
    }

    return realCtor;
  },

  extend: function(obj, props) {
    this.own(props, function(x) {
      var pd = Object.getOwnPropertyDescriptor(props, x);
      if ( (typeof pd["get"] == "function") ||
           (typeof pd["set"] == "function") ) {
        Object.defineProperty(obj, x, pd);
      } else if (typeof pd["value"] == "function" ||x.charAt(0) === "_") {
        pd.writable = true;
        pd.configurable = true;
        pd.enumerable = false;
        Object.defineProperty(obj, x, pd);
      } else {
        obj[x] = props[x];
      }
    });
    return obj;
  },

  own: function(obj, cb, context) {
    Object.getOwnPropertyNames(obj).forEach(cb, context||scope);
    return obj;
  },

  debugprint: function(s /*String*/) {
    if (c.verbose) console.log(s);
  },

  traceprint: function(s /*String*/) {
    if (c.verbose) console.log(s);
  },

  fnenterprint: function(s /*String*/) { console.log("* " + s); },

  fnexitprint: function(s /*String*/) { console.log("- " + s); },

  Assert: function(f /*boolean*/, description /*String*/) {
    if (!f) {
      throw new c.InternalError("Assertion failed: " + description);
    }
  },

  Plus: function(e1, e2) {
    if (!(e1 instanceof c.Expression)) {
      e1 = new c.Expression(e1);
    }
    if (!(e2 instanceof c.Expression)) {
      e2 = new c.Expression(e2);
    }
    return e1.plus(e2);
  },

  Minus: function(e1, e2) {
    if (!(e1 instanceof c.Expression)) {
      e1 = new c.Expression(e1);
    }
    if (!(e2 instanceof c.Expression)) {
      e2 = new c.Expression(e2);
    }

    return e1.minus(e2);
  },

  Times: function(e1, e2) {
    if (typeof e1 == "number" || e1 instanceof c._Variable) {
      e1 = new c.Expression(e1);
    }
    if (typeof e2 == "number" || e2 instanceof c._Variable) {
      e2 = new c.Expression(e2);
    }

    return e1.times(e2);
  },

  Divide: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    if (typeof e1 == "number" || e1 instanceof c._Variable) {
      e1 = new c.Expression(e1);
    }
    if (typeof e2 == "number" || e2 instanceof c._Variable) {
      e2 = new c.Expression(e2);
    }

    return e1.divide(e2);
  },

  approx: function(a /*double*/, b /*double*/) {
    if (a === b) { return true; }
    var av, bv;
    av = (a instanceof c._Variable) ? a.value : a;
    bv = (b instanceof c._Variable) ? b.value : b;
    if (av == 0) {
      return (Math.abs(bv) < epsilon);
    }
    if (bv == 0) {
      return (Math.abs(av) < epsilon);
    }
    return (Math.abs(av - bv) < Math.abs(av) * epsilon);
  },

  _inc: (function(count){
    return function() { return count++; };
  })(0),

  _json_receivers: {},

  fromJSON: function(str) {
    JSON.parse(str, function(k, v) {
      if (this["class"]) {
        // TODO(slightlyoff): revive based on class ref.
      }
    });
  },
};

})(this);
