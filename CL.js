// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;

(function(){

var empty = {};

// Parts borrowed from Dojo
// FIXME(slightlyoff): still needed?
var _mixin = function(dest, source, copyFunc){
  var name, s, i;
  for(name in source){
    // the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
    // inherited from Object.prototype.	 For example, if dest has a custom toString() method,
    // don't overwrite it with the toString() method that source inherited from Object.prototype
    s = source[name];
    if(!(name in dest) || 
        (dest[name] !== s && 
          (!(name in empty) || empty[name] !== s)
        )
    ){ dest[name] = copyFunc ? copyFunc(s) : s; }
  }
  return dest;
};

/*
if (!console && !print) {
  var print;
  if (!!this['console']) {
    print = console.log;
  } else {
    print = function(){};
  }
}
*/


// Global
c = CL = {
  fDebugOn: true,
  fVerboseTraceOn: false,
  fTraceOn: false,
  fTraceAdded: false,
  fGC: false,
  //fTraceOn: true,
  //fTraceAdded: true,
  GEQ: 1,
  LEQ: 2,

  mixin: function(dest, sources){
    if(!dest){ dest = {}; }
    for(var i = 1, l = arguments.length; i < l; i++){
      _mixin(dest, arguments[i]);
    }
    return dest; // Object
  },

  extend: function(constructor, props) {
    for(var i=1, l=arguments.length; i<l; i++){
      _mixin(constructor.prototype, arguments[i]);
    }
    return constructor; // Object
  },

  inherit: function(ctor, parent, props) {
    var al = arguments.length;
    // Data-only extension
    if (al == 1) {
      props = ctor;
      ctor = null;
      parent = null

      if (props["Extends"] || props["extends"]) {
        parent = props["Extends"] || props["extends"];
        delete props["Extends"];
        delete props["extends"];
      }

      if (props["initialize"]) {
        ctor = props["initialize"];
        delete props["initialize"];
      }
    }

    // No ctor specified
    if (al == 2) {
      props = parent;
      parent = ctor;
      ctor = null;
    }

    // Default
    var dprops = {};
    var ctor = ctor || function() {};
    for (var x in props) {
      if (props.hasOwnProperty(x)) {
        dprops[x] = {
          value: props[x],
          enumerable: false,
          writable: true,
          configrable: true,
        }
      }
    }
    ctor.prototype = Object.create(((parent) ? parent.prototype : Object.prototype), dprops);
    return ctor;
  },

  debugprint: function(s /*String*/) {
    if (!CL.fVerboseTraceOn) return;
    console.log(s);
  },

  traceprint: function(s /*String*/) {
    if (!CL.fVerboseTraceOn) return;
    console.log(s);
  },

  fnenterprint: function(s /*String*/) { console.log("* " + s); },

  fnexitprint: function(s /*String*/) { console.log("- " + s); },

  Assert: function(f /*boolean*/, description /*String*/) {
    if (!f) {
      throw new c.InternalError("Assertion failed:" + description);
    }
  },

  Plus: function(e1, e2) {
    if (!(e1 instanceof c.LinearExpression)) {
      e1 = new c.LinearExpression(e1);
    }
    if (!(e2 instanceof c.LinearExpression)) {
      e2 = new c.LinearExpression(e2);
    }
    return e1.plus(e2);
  },
  
  Minus: function(e1, e2) {
    if (!(e1 instanceof c.LinearExpression)) {
      e1 = new c.LinearExpression(e1);
    }

    if (!(e2 instanceof c.LinearExpression)) {
      e2 = new c.LinearExpression(e2);
    }

    return e1.minus(e2);
  },

  Times: function(e1,e2) {
    if (e1 instanceof c.LinearExpression &&
        e2 instanceof c.LinearExpression) {
      return e1.times(e2);
    } else if (e1 instanceof c.LinearExpression &&
               e2 instanceof c.Variable) {
      return e1.times(new c.LinearExpression(e2));
    } else if (e1 instanceof c.Variable &&
               e2 instanceof c.LinearExpression) {
      return (new c.LinearExpression(e1)).times(e2);
    } else if (e1 instanceof c.LinearExpression &&
               typeof(e2) == 'number') {
      return e1.times(new c.LinearExpression(e2));
    } else if (typeof(e1) == 'number' &&
               e2 instanceof c.LinearExpression) {
      return (new c.LinearExpression(e1)).times(e2);
    } else if (typeof(e1) == 'number' &&
               e2 instanceof c.Variable) {
      return (new c.LinearExpression(e2, e1));
    } else if (e1 instanceof c.Variable &&
               typeof(e2) == 'number') {
      return (new c.LinearExpression(e1, e2));
    } else if (e1 instanceof c.Variable &&
               e2 instanceof c.LinearExpression) {
      return (new c.LinearExpression(e2, n));
    }
  },

  Divide: function(e1 /*c.LinearExpression*/, e2 /*c.LinearExpression*/) {
    return e1.divide(e2);
  },

  approx: function(a /*double*/, b /*double*/) {
    if (a instanceof c.Variable) {
      a = a.value();
    }
    if (b instanceof c.Variable) {
      b = b.value();
    }
    epsilon = 1.0e-8;
    if (a == 0.0) {
      return (Math.abs(b) < epsilon);
    } else if (b == 0.0) {
      return (Math.abs(a) < epsilon);
    } else {
      return (Math.abs(a - b) < Math.abs(a) * epsilon);
    }
  },

  hashToString: function(h) {
    var answer = "";
    CL.Assert(h instanceof Hashtable);
    h.each( function(k,v) {
      answer += k + " => ";
      if (v instanceof Hashtable) {
        answer += CL.hashToString(v);
      } else if (v instanceof HashSet) {
        answer += CL.setToString(v);
      } else {
        answer += v + "\n";
      }
    });
    return answer;
  },

  setToString: function(s) {
    if (!s) return;
    CL.Assert(s instanceof HashSet);
    var answer = s.size() + " {";
    var first = true;
    s.each(function(e) {
      if (!first) {
        answer += ", ";
      } else {
        first = false;
      }
      answer += e;
    });
    answer += "}\n";
    return answer;
  }       
};

})();
