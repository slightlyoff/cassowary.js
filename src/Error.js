// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011-2012, Alex Russell (slightlyoff@chromium.org)

(function(c){
  "use strict";

  c.Error = c.inherit({
    initialize: function(s /*String*/) { if (s) { this.description = s; } },
    _name: "c.Error",
    _description: "An error has occured in Cassowary",
    set description(v) { this._description = v; },
    get description()  { return "(" + this._name + ") " + this._description; },
    toString: function() { return this.description; },
  });

  var errorType = function(name, error) {
    return c.inherit({ extends: c.Error, _name: name||"", _description: error||"" });
  };

  c.ConstraintNotFound = 
    errorType("c.ConstraintNotFound",
        "Tried to remove a constraint never added to the tableu");

  c.InternalError = 
    errorType("c.InternalError");

  c.NonlinearExpression = 
    errorType("c.NonlinearExpression",
        "The resulting expression would be nonlinear");

  c.NotEnoughStays = 
    errorType("c.NotEnoughStays", 
        "There are not enough stays to give specific values to every variable");

  c.RequiredFailure =
    errorType("c.RequiredFailure", "A required constraint cannot be satisfied");

  c.TooDifficult =
    errorType("c.TooDifficult", "The constraints are too difficult to solve");

})(c);
