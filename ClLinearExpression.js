// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;

(function(c) {

c.LinearExpression = c.inherit({
  /* FIELDS:
     private ClDouble constant
     private SimpleHashtable _terms
 */
  initialize: function(clv /*c.AbstractVariable*/, value /*double*/, constant /*double*/) {
    if (CL.GC) print("new c.LinearExpression");
    this.constant = constant || 0;
    this._terms = new SimpleHashtable();

    if (clv instanceof c.AbstractVariable) {
      this._terms.put(clv, value || 1);
    } else if (typeof(clv) == 'number') {
      this.constant = clv;
    }
  },

  initializeFromHash: function(constant /*ClDouble*/, terms /*SimpleHashtable*/) {
    if(CL.verbose) {
      console.log("*******************************");
      console.log("clone c.initializeFromHash");
      console.log("*******************************");
    }

    if (CL.GC) print("clone c.LinearExpression");
    this.constant = constant;
    this._terms = terms.clone();
    return this;
  },
  
  multiplyMe: function(x /*double*/) {
    var that = this;
    this.constant *= x;
    this._terms.each(function(clv, coeff) {
      that._terms.put(clv, coeff * x);
    });
    return this;
  },

  clone: function() {
    if(CL.verbose) {
      console.log("*******************************");
      console.log("clone c.LinearExpression");
      console.log("*******************************");
    }

    var le = new c.LinearExpression();
    le.initializeFromHash(this.constant, this._terms);
    return le;
  },

  times: function(x) {
    if (typeof(x) == 'number') {
      return (this.clone()).multiplyMe(x);
    } else {
      if (this.isConstant()) {
        expr = x;
        return expr.times(this.constant);
      } else if (expr.isConstant()) {
        return this.times(expr.constant);
      } else {
        throw new c.NonlinearExpression();
      }
    }
  },

  plus: function(expr /*c.LinearExpression*/) {
    if (expr instanceof c.LinearExpression) {
      return this.clone().addExpression(expr, 1.0);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, 1.0);
    }
  },

  minus: function(expr /*c.LinearExpression*/) {
    if (expr instanceof c.LinearExpression) {
      return this.clone().addExpression(expr, -1.0);
    } else if (expr instanceof c.Variable) {
      return this.clone().addVariable(expr, -1.0);
    }
  },


  divide: function(x) {
    if (typeof(x) == 'number') {
      if (CL.approx(x, 0.0)) {
        throw new c.NonlinearExpression();
      }
      return this.times(1.0 / x);
    } else if (x instanceof c.LinearExpression) {
      if (!x.isConstant) {
        throw new c.NonlinearExpression();
      }
      return this.times(1.0 / x.constant);
    }
  },

  divFrom: function(expr) {
    if (!this.isConstant() || CL.approx(this.constant, 0.0)) {
        throw new c.NonlinearExpression();
    }
    return x.divide(this.constant);
  },

  subtractFrom: function(expr /*c.LinearExpression*/) {
    return expr.minus(this);
  },

  addExpression: function(expr /*c.LinearExpression*/, n /*double*/, subject /*c.AbstractVariable*/, solver /*ClTableau*/) {
    if (expr instanceof c.AbstractVariable) {
      expr = new c.LinearExpression(expr);
      print("addExpression: Had to cast a var to an expression");
    }
    this.constant += (n * expr.constant);
    n = n || 1;
    var that = this;
    expr.terms().each(function(clv, coeff) {
      that.addVariable(clv, coeff*n, subject, solver);
    });
    return this;
  },

  addVariable: function(v /*c.AbstractVariable*/, c /*double*/, subject, solver) {
    c = c || 1.0;
    if (CL.trace) CL.fnenterprint("CLE: addVariable:" + v + ", " + c);
    coeff = this._terms.get(v);
    if (coeff) {
      new_coefficient = coeff + c;
      if (CL.approx(new_coefficient, 0.0)) {
        if (solver) {
          solver.noteRemovedVariable(v, subject);
        }
        this._terms.remove(v);
      } else {
        this._terms.put(v, new_coefficient);
      }
    } else {
      if (!CL.approx(c, 0.0)) {
        this._terms.put(v, c);
        if (solver) {
          solver.noteAddedVariable(v, subject);
        }
      }
    }
    return this;
  },

  setVariable: function(v /*c.AbstractVariable*/, c /*double*/) {
    this._terms.put(v, c);
    return this;
  },

  anyPivotableVariable: function() {
    if (this.isConstant()) {
      throw new c.InternalError("anyPivotableVariable called on a constant");
    } 
    
    this._terms.each(function(clv, c) {
      if (clv.isPivotable()) return clv;
    });
    return null;
  },
  
  substituteOut: function(outvar /*c.AbstractVariable*/, expr /*c.LinearExpression*/, subject /*c.AbstractVariable*/, solver /*ClTableau*/) {
    var that = this;
    if (CL.trace) CL.fnenterprint("CLE:substituteOut: " + outvar + ", " + expr + ", " + subject + ", ...");
    if (CL.trace) CL.traceprint("this = " + this);
    var multiplier = this._terms.remove(outvar);
    this.constant += (multiplier * expr.constant);
    expr.terms().each(function(clv, coeff) {
      var old_coeff = that._terms.get(clv);
      if (old_coeff) {
        var newCoeff = old_coeff + multiplier * coeff;
        if (CL.approx(newCoeff, 0.0)) {
          solver.noteRemovedVariable(clv, subject);
          that._terms.remove(clv);
        } else {
          that._terms.put(clv, newCoeff);
        }
      } else {
        that._terms.put(clv, multiplier * coeff);
        solver.noteAddedVariable(clv, subject);
      }
    });
    if (CL.trace) CL.traceprint("Now this is " + this);
  },

  changeSubject: function(old_subject /*c.AbstractVariable*/, new_subject /*c.AbstractVariable*/) {
    this._terms.put(old_subject, this.newSubject(new_subject));
  },

  newSubject: function(subject /*c.AbstractVariable*/) {
    if (CL.trace) CL.fnenterprint("newSubject:" + subject);
    
    var reciprocal = 1.0 / this._terms.remove(subject);
    this.multiplyMe(-reciprocal);
    return reciprocal;
  },

  coefficientFor: function(clv /*c.AbstractVariable*/) {
    return this._terms.get(clv) || 0;
  },

  terms: function() {
    return this._terms;
  },

  isConstant: function() {
    return this._terms.size() == 0;
  },

  toString: function() {
    var bstr = ''; // answer
    var needsplus = false;
    if (!CL.approx(this.constant, 0.0) || this.isConstant()) {
      bstr += this.constant;
      if (this.isConstant()) {
        return bstr;
      } else {
        needsplus = true;
      }
    } 
    this._terms.each( function(clv, coeff) {
      if (needsplus) {
        bstr += " + ";
      }
      bstr += coeff + "*" + clv;
      needsplus = true;
    });
    return bstr;
  },

  Plus: function(e1 /*c.LinearExpression*/, e2 /*c.LinearExpression*/) {
    return e1.plus(e2);
  },
  Minus: function(e1 /*c.LinearExpression*/, e2 /*c.LinearExpression*/) {
    return e1.minus(e2);
  },
  Times: function(e1 /*c.LinearExpression*/, e2 /*c.LinearExpression*/) {
    return e1.times(e2);
  },
  Divide: function(e1 /*c.LinearExpression*/, e2 /*c.LinearExpression*/) {
    return e1.divide(e2);
  },
});

})(CL);

