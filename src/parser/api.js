// Copyright (C) 2013, Alex Russell <slightlyoff@chromium.org>
// Use of this source code is governed by
//    http://www.apache.org/licenses/LICENSE-2.0

(function(c){
"use strict";

var solver = new c.SimplexSolver();
var vars = {};
var exprs = {};

var weak = c.Strength.weak;
var medium = c.Strength.medium;
var strong = c.Strength.strong;
var required = c.Strength.required;

var _c = function(expr) {
  if (exprs[expr]) {
    return exprs[expr];
  }
  var i;
  switch(expr.type) {
    case "Inequality":
      var op = (expr.operator === "<=") ? c.LEQ : c.GEQ;
      i = new c.Inequality(_c(expr.left), op, _c(expr.right), strong);
      solver.addConstraint(i);
      return i;
    case "Equality":
      i = new c.Equation(_c(expr.left), _c(expr.right), strong);
      solver.addConstraint(i);
      return i;
    case "MultiplicativeExpression":
      if (expr.operator === "/") {
          i = c.divide(_c(expr.left), _c(expr.right));
      } else {
          i = c.times(_c(expr.left), _c(expr.right));
      }
      return i;
    case "AdditiveExpression":
      if (expr.operator === "+") {
        i = c.plus(_c(expr.left), _c(expr.right));
      } else {
        i = c.minus(_c(expr.left), _c(expr.right));
      }
      return i;
    case "NumericLiteral":
      return new c.Expression(expr.value);
    case "Variable":
      // special variable to get the solver instance
      if(expr.name === 'solver') {
          return solver;
      }

      if(!vars[expr.name]) {
        vars[expr.name] = new c.Variable({ name: expr.name });
      }
      return vars[expr.name];
    case "UnaryExpression":
      console.log("UnaryExpression...WTF?");
      break;
  }
};

var compile = function(expressions) {
  return expressions.map(_c);
};

// Global API entrypoint
c._api = function() {
  var args = Array.prototype.slice.call(arguments);
  var out = {};

  if (args.length === 1) {
    if(typeof args[0] === "string") {
      // Parse and execute it
      var r = c.parser.parse(args[0]);
      out = compile(r);

      // easy getters for solver instance and variables
      // allows you to perform c('solver') and c('variableName')
      if(out.length === 1 && (
          out[0] instanceof c.SimplexSolver ||
          out[0] instanceof c.Variable
        )) { return out[0]; }

      // attach solver and variable list
      out.solver = solver;
      out.vars = vars;

      return out;

    } else if(typeof args[0] === "function") {
      solver._addCallback(args[0]);
    }
  }
};

})(this["c"]||module.parent.exports||{});
