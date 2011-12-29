
(function(c) {

c.LinearConstraint = c.inherit({
  extends: c.Constraint,
  initialize: function(cle /*c.LinearExpression*/, 
                       strength /*c.Strength*/,
                       weight /*double*/) {
    c.Constraint.call(this, strength, weight);
    this.expression = cle;
  },
});


c.LinearInequality = c.inherit({
  extends: c.LinearConstraint,
  initialize: function(a1, a2, a3, a4, a5) {
    if (a1 instanceof c.LinearExpression &&
        a3 instanceof c.AbstractVariable) {
      var cle = a1, op = a2, clv = a3, strength = a4, weight = a5;
      c.LinearConstraint.call(this, cle.clone(), strength, weight);
      if (op == CL.LEQ) {
        this.expression.multiplyMe(-1);
        this.expression.addVariable(clv);
      } else if (op == CL.GEQ) {
        this.expression.addVariable(clv, -1);
      } else {
        throw new c.InternalError("Invalid operator in ClLinearInequality constructor");
      }
    } else if (a1 instanceof c.LinearExpression) {
      return c.LinearConstraint.call(this, a1, a2, a3);
    } else if (a2 == CL.GEQ) {
      c.LinearConstraint.call(this, new c.LinearExpression(a3), a4, a5);
      this.expression.multiplyMe(-1.0);
      this.expression.addVariable(a1);
    } else if (a2 == CL.LEQ) {
      c.LinearConstraint.call(this, new c.LinearExpression(a3), a4, a5);
      this.expression.addVariable(a1,-1.0);
    } else {
      throw new ExCLInternalError("Invalid operator in ClLinearInequality constructor");
    }
  },

  isInequality: true,

  toString: function() {
    return c.LinearConstraint.prototype.toString.call(this) + " >= 0 )";
  },
});

var lc = c.LinearConstraint;

c.LinearEquation = c.inherit({
  extends: c.LinearConstraint,
  initialize: function(a1, a2, a3, a4) {
    if (a1 instanceof c.LinearExpression && !a2 || a2 instanceof c.Strength) {
      lc.call(this, a1, a2, a3);
    } else if ((a1 instanceof c.AbstractVariable) &&
               (a2 instanceof c.LinearExpression)) {
      var clv = a1, cle = a2, strength = a3, weight = a4;
      lc.call(this, cle, strength, weight);
      this.expression.addVariable(clv, -1);
    } else if ((a1 instanceof c.AbstractVariable) &&
               (typeof(a2) == 'number')) {
      var clv = a1, val = a2, strength = a3, weight = a4;
      lc.call(this, new c.LinearExpression(val), strength, weight);
      this.expression.addVariable(clv, -1);
    } else if ((a1 instanceof c.LinearExpression) &&
               (a2 instanceof c.AbstractVariable)) {
      var cle = a1, clv = a2, strength = a3, weight = a4;
      lc.call(this, cle.clone(), strength, weight);
      this.expression.addVariable(clv, -1);
    } else if (((a1 instanceof c.LinearExpression) || (a1 instanceof c.AbstractVariable) ||
                (typeof(a1) == 'number')) &&
               ((a2 instanceof c.LinearExpression) || (a2 instanceof c.AbstractVariable) ||
                (typeof(a2) == 'number'))) {
      if (a1 instanceof c.LinearExpression) {
        a1 = a1.clone();
      } else {
        a1 = new c.LinearExpression(a1);
      }
      if (a2 instanceof c.LinearExpression) {
        a2 = a2.clone();
      } else {
        a2 = new c.LinearExpression(a2);
      }
      lc.call(this, a1, a3, a4);
      this.expression.addExpression(a2, -1);
    } else {
      throw "Bad initializer to ClLinearEquation";
    }
    CL.Assert(this.strength instanceof c.Strength, "_strength not set");
  },

  toString: function() {
    return lc.prototype.toString.call(this) + " = 0 )";
  },
});

})(CL);
