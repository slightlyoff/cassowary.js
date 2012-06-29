// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.AbstractConstraint = c.inherit({
  initialize: function(strength /*c.Strength*/, weight /*double*/) {
    this.hash_code = c._inc();
    this.strength = strength || c.Strength.required;
    this.weight = weight || 1;
  },

  isEditConstraint: false,
  isInequality:     false,
  isStayConstraint: false,
  hashCode: function() { return this.hash_code; },
  // FIXME(slightlyoff): value, at worst a getter
  isRequired: function() { return this.strength.isRequired(); },

  toString: function() {
    // this is abstract -- it intentionally leaves the parens unbalanced for
    // the subclasses to complete (e.g., with ' = 0', etc.
    return this.strength + " {" + this.weight + "} (" + this.expression +")";
  },
});

var ts = c.AbstractConstraint.prototype.toString;

var EditOrStayCtor = function(clv /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
  c.AbstractConstraint.call(this, strength || c.Strength.strong, weight);
  this.variable = clv;
  this.expression = new c.Expression(clv, -1, clv.value());
};

c.EditConstraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isEditConstraint: true,
  toString: function() { return "edit:" + ts.call(this); },
});

c.StayConstraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function() { EditOrStayCtor.apply(this, arguments); },
  isStayConstraint: true,
  toString: function() { return "stay:" + ts.call(this); },
});

c.Constraint = c.inherit({
  extends: c.AbstractConstraint,
  initialize: function(cle /*c.Expression*/, 
                       strength /*c.Strength*/,
                       weight /*double*/) {
    c.AbstractConstraint.call(this, strength, weight);
    this.expression = cle;
  },
});

c.LinearInequality = c.inherit({
  extends: c.Constraint,
  
  _cloneOrNewCle: function(cle) {
    // FIXME(D4): move somewhere else?
    if (cle.clone)  {
      return cle.clone();
    } else { 
      return new c.Expression(cle);
    }
  },

  initialize: function(a1, a2, a3, a4, a5) {
    // FIXME(slightlyoff): what a disgusting mess. Should at least add docs.
    // console.log("c.LinearInequality.initialize(", a1, a2, a3, a4, a5, ")");
    // 
    // (cle || number), op, clv
    var a1IsExp, a3IsExp, a1IsNum, a3IsNum, a1IsVar, a3IsVar;
    a1IsExp = a1 instanceof c.Expression;
    a3IsExp = a3 instanceof c.Expression;
    a1IsVar = a1 instanceof c.AbstractVariable;
    a3IsVar = a3 instanceof c.AbstractVariable;
    a1IsNum = typeof(a1) == 'number';
    a3IsNum = typeof(a3) == 'number';
    
    if ((a1IsExp || a1IsNum) && a3IsVar) {      
      var cle = a1, op = a2, clv = a3, strength = a4, weight = a5;
      c.Constraint.call(this, this._cloneOrNewCle(cle), strength, weight);
      if (op == c.LEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addVariable(clv);
      } else if (op == c.GEQ) {
        this.expression.addVariable(clv, -1);
      } else {
        throw new c.InternalError("Invalid operator in ClLinearInequality constructor");
      }    
    // clv, op, (cle || number)
    } else if (a1IsVar && (a3IsExp || a3IsNum)) {      
      var cle = a3, op = a2, clv = a1, strength = a4, weight = a5;
      c.Constraint.call(this, this._cloneOrNewCle(cle), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addVariable(clv);
      } else if (op == c.LEQ) {
        this.expression.addVariable(clv, -1);
      } else {
        throw new c.InternalError("Invalid operator in ClLinearInequality constructor");
      }    
    // cle, op, num
    } else if (a1IsExp && a3IsNum) {
      var cle1 = a1, op = a2, cle2 = a3, strength = a4, weight = a5;
      c.Constraint.call(this, this._cloneOrNewCle(cle1), strength, weight);
      if (op == c.LEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle2));
      } else if (op == c.GEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle2), -1);
      } else {
        throw new c.InternalError("Invalid operator in ClLinearInequality constructor");
      }
      return this      
    // num, op, cle
    } else if (a1IsNum && a3IsExp) {
      var cle1 = a3, op = a2, cle2 = a1, strength = a4, weight = a5; 
      c.Constraint.call(this, this._cloneOrNewCle(cle1), strength, weight);      
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle2));
      } else if (op == c.LEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle2), -1);
      } else {
        throw new c.InternalError("Invalid operator in ClLinearInequality constructor");
      }
      return this     
    // cle op cle
    } else if (a1IsExp && a3IsExp) {
      var cle1 = a1, op = a2, cle2 = a3, strength = a4, weight = a5;
      c.Constraint.call(this, this._cloneOrNewCle(cle2), strength, weight);
      if (op == c.GEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addExpression(this._cloneOrNewCle(cle1));
      } else if (op == c.LEQ) {
        this.expression.addExpression(this._cloneOrNewCle(cle1), -1);
      } else {
        throw new c.InternalError("Invalid operator in ClLinearInequality constructor");
      }       
    // cle
    } else if (a1IsExp) {
      return c.Constraint.call(this, a1, a2, a3);    
    // >=
    } else if (a2 == c.GEQ) {
      c.Constraint.call(this, new c.Expression(a3), a4, a5);
      this.expression.multiplyMe(-1);
      this.expression.addVariable(a1);
    // <=
    } else if (a2 == c.LEQ) {
      c.Constraint.call(this, new c.Expression(a3), a4, a5);
      this.expression.addVariable(a1,-1);
    // error
    } else {
      throw new c.InternalError("Invalid operator in ClLinearInequality constructor");
    }
  },

  isInequality: true,

  toString: function() {
    // return "c.LinearInequality: " + this.hashCode();
    return c.Constraint.prototype.toString.call(this) + " >= 0 ) id: " + this.hash_code;
  },
});

var lc = c.Constraint;

c.LinearEquation = c.inherit({
  extends: c.Constraint,
  initialize: function(a1, a2, a3, a4) {
    // FIXME(slightlyoff): this is just a huge mess.
    if (a1 instanceof c.Expression && !a2 || a2 instanceof c.Strength) {
      lc.call(this, a1, a2, a3);
    } else if ((a1 instanceof c.AbstractVariable) &&
               (a2 instanceof c.Expression)) {
      var clv = a1, cle = a2, strength = a3, weight = a4;
      lc.call(this, cle, strength, weight);
      this.expression.addVariable(clv, -1);
    } else if ((a1 instanceof c.AbstractVariable) &&
               (typeof(a2) == 'number')) {
      var clv = a1, val = a2, strength = a3, weight = a4;
      lc.call(this, new c.Expression(val), strength, weight);
      this.expression.addVariable(clv, -1);
    } else if ((a1 instanceof c.Expression) &&
               (a2 instanceof c.AbstractVariable)) {
      var cle = a1, clv = a2, strength = a3, weight = a4;
      lc.call(this, cle.clone(), strength, weight);
      this.expression.addVariable(clv, -1);
    } else if (((a1 instanceof c.Expression) || (a1 instanceof c.AbstractVariable) ||
                (typeof(a1) == 'number')) &&
               ((a2 instanceof c.Expression) || (a2 instanceof c.AbstractVariable) ||
                (typeof(a2) == 'number'))) {
      if (a1 instanceof c.Expression) {
        a1 = a1.clone();
      } else {
        a1 = new c.Expression(a1);
      }
      if (a2 instanceof c.Expression) {
        a2 = a2.clone();
      } else {
        a2 = new c.Expression(a2);
      }
      lc.call(this, a1, a3, a4);
      this.expression.addExpression(a2, -1);
    } else {
      throw "Bad initializer to ClLinearEquation";
    }
    c.Assert(this.strength instanceof c.Strength, "_strength not set");
  },

  toString: function() {
    return lc.prototype.toString.call(this) + " = 0 )";
  },
});

})(c);
