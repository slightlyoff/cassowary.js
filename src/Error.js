// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c){
  "use strict";

  c.Error = c.inherit({
    description: function() {
      return "(c.Error) An error has occured in CL";
    },
    toString: function() {
      return this.description();
    }
  });

  c.ConstraintNotFound = c.inherit({
    extends: c.Error,
    description: function() {
      return "(c.ConstraintNotFound) Tried to remove a constraint never added to the tableu";
    },
  });

  c.InternalError = c.inherit({
    extends: c.Error,
    initialize: function(s /*String*/) {
      description_ = s;
    },
    description: function() {
      return "(c.InternalError) " + description_;
    },
  });

  c.NonlinearExpression = c.inherit({
    extends: c.Error,
    description: function() {
      return "(c.NonlinearExpression) The resulting expression would be nonlinear";
    },
  });

  c.NotEnoughStays = c.inherit({
    extends: c.Error,
    description: function() {
      return "(c.NotEnoughStays) There are not enough stays to give specific values to every variable";
    },
  });

  c.RequiredFailure = c.inherit({
    extends: c.Error,
    description: function() {
      return "(c.RequiredFailure) A required constraint cannot be satisfied";
    },
  });

  c.TooDifficult = c.inherit({
    extends: c.Error,
    description: function() {
      return "(c.TooDifficult) The constraints are too difficult to solve";
    },
  });
})(c);
