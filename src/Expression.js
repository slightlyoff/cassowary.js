// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;

(function(c) {
"use strict";

c.Expression = c.inherit({
  /* FIELDS:
     private ClDouble constant
  */
  initialize: function(clv /*c.AbstractVariable*/, value /*double*/, constant /*double*/) {
    if (c.GC) console.log("new c.Expression");
    this.constant = (typeof constant == "number" && !isNaN(constant)) ? constant : 0;
    this.terms = new c.HashTable();

    if (clv instanceof c.AbstractVariable) {
      this.terms.set(clv, typeof value == 'number' ? value : 1);
    } else if (typeof clv == "number") {
      // FIXME(slighltyoff):
      //    This isNaN() check slows us down by ~75% on V8 in our synthetic
      //    perf test!
      if (!isNaN(clv)) {
        this.constant = clv;
      }
    }
  },

  initializeFromHash: function(constant /*ClDouble*/, terms /*c.Hashtable*/) {
    if(c.verbose) {
      console.log("*******************************");
      console.log("clone c.initializeFromHash");
      console.log("*******************************");
    }

    if (c.GC) console.log("clone c.Expression");
    this.constant = constant;
    this.terms = terms.clone();
    return this;
  },
  
  multiplyMe: function(x /*double*/) {
    this.constant *= x;
    var t = this.terms;
    t.each(function(clv, coeff) { t.set(clv, coeff * x); });
    return this;
  },

  clone: function() {
    if(c.verbose) {
      console.log("*******************************");
      console.log("clone c.Expression");
      console.log("*******************************");
    }

    var le = new c.Expression();
    le.initializeFromHash(this.constant, this.terms);
    return le;
  },

  times: function(x) {
    if (typeof x == 'number') {
      return (this.clone()).multiplyMe(x);
    } else {
      if (this.isConstant()) {
        return x.times(this.constant);
      } else if (x.isConstant()) {
        return this.times(x.constant);
      } else {
        throw new c.NonExpression();
      }
    }
  },

  plus: function(expr /*c.Expression*/) {
    if (expr instanceof c.Expression) {
      return this.clone().addExpression(expr, 1);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, 1);
    }
  },

  minus: function(expr /*c.Expression*/) {
    if (expr instanceof c.Expression) {
      return this.clone().addExpression(expr, -1);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, -1);
    }
  },

  divide: function(x) {
    if (typeof x == 'number') {
      if (c.approx(x, 0)) {
        throw new c.NonExpression();
      }
      return this.times(1 / x);
    } else if (x instanceof c.Expression) {
      if (!x.isConstant()) {
        throw new c.NonExpression();
      }
      return this.times(1 / x.constant);
    }
  },

  addExpression: function(expr /*c.Expression*/,
                          n /*double*/,
                          subject /*c.AbstractVariable*/,
                          solver /*c.Tableau*/) {

    if (expr instanceof c.AbstractVariable) {
      expr = new c.Expression(expr);
      if(c.trace) console.log("addExpression: Had to cast a var to an expression");
    }
    n = n || 1;
    this.constant += (n * expr.constant);
    expr.terms.each(function(clv, coeff) {
      this.addVariable(clv, coeff * n, subject, solver);
    }, this);
    return this;
  },

  addVariable: function(v /*c.AbstractVariable*/, cd /*double*/, subject, solver) {
    if (cd == null) {
      cd = 1;
    }
    
    if (c.trace) c.fnenterprint("CLE: addVariable:" + v + ", " + cd);
    var coeff = this.terms.get(v);
    if (coeff) {
      var new_coefficient = coeff + cd;
      if (c.approx(new_coefficient, 0)) {
        if (solver) {
          solver.noteRemovedVariable(v, subject);
        }
        this.terms.remove(v);
      } else {
        this.terms.set(v, new_coefficient);
      }
    } else {
      if (!c.approx(cd, 0)) {
        this.terms.set(v, cd);
        if (solver) {
          solver.noteAddedVariable(v, subject);
        }
      }
    }
    return this;
  },

  setVariable: function(v /*c.AbstractVariable*/, c /*double*/) {
    this.terms.set(v, c);
    return this;
  },

  anyPivotableVariable: function() {
    if (this.isConstant()) {
      throw new c.InternalError("anyPivotableVariable called on a constant");
    } 
    
    var rv = this.terms.escapingEach(function(clv, c) {
      if (clv.isPivotable) return { retval: clv };
    });
    
    if (rv && rv.retval !== undefined) {
      return rv.retval;
    }
    
    return null;
  },
  
  substituteOut: function(outvar /*c.AbstractVariable*/,
                          expr /*c.Expression*/,
                          subject /*c.AbstractVariable*/,
                          solver /*ClTableau*/) {
    if (c.trace) {
      c.fnenterprint("CLE:substituteOut: " + outvar + ", " + expr + ", " + subject + ", ...");
      c.traceprint("this = " + this);
    }
    var multiplier = this.terms.remove(outvar);
    this.constant += (multiplier * expr.constant);
    expr.terms.each(function(clv, coeff) {
      var old_coeff = this.terms.get(clv);
      if (old_coeff) {
        var newCoeff = old_coeff + multiplier * coeff;
        if (c.approx(newCoeff, 0)) {
          solver.noteRemovedVariable(clv, subject);
          this.terms.remove(clv);
        } else {
          this.terms.set(clv, newCoeff);
        }
      } else {
        this.terms.set(clv, multiplier * coeff);
        if (solver) solver.noteAddedVariable(clv, subject);
      }
    }, this);
    if (c.trace) c.traceprint("Now this is " + this);
  },

  changeSubject: function(old_subject /*c.AbstractVariable*/,
                          new_subject /*c.AbstractVariable*/) {
    this.terms.set(old_subject, this.newSubject(new_subject));
  },

  newSubject: function(subject /*c.AbstractVariable*/) {
    if (c.trace) c.fnenterprint("newSubject:" + subject);
    
    var reciprocal = 1 / this.terms.remove(subject);
    this.multiplyMe(-reciprocal);
    return reciprocal;
  },

  coefficientFor: function(clv /*c.AbstractVariable*/) {
    return this.terms.get(clv) || 0;
  },

  isConstant: function() {
    return this.terms.size() == 0;
  },

  toString: function() {
    var bstr = ''; // answer
    var needsplus = false;
    if (!c.approx(this.constant, 0) || this.isConstant()) {
      bstr += this.constant;
      if (this.isConstant()) {
        return bstr;
      } else {
        needsplus = true;
      }
    } 
    this.terms.each( function(clv, coeff) {
      if (needsplus) {
        bstr += " + ";
      }
      bstr += coeff + "*" + clv;
      needsplus = true;
    });
    return bstr;
  },
  
  equals: function(other) {
    if (other === this) {
      return true;
    }
    
    return other instanceof c.Expression && 
           other.constant == this.constant && 
           other.terms.equals(this.terms);
  },

  Plus: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.plus(e2);
  },
  Minus: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.minus(e2);
  },
  Times: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.times(e2);
  },
  Divide: function(e1 /*c.Expression*/, e2 /*c.Expression*/) {
    return e1.divide(e2);
  },
});

})(c);
