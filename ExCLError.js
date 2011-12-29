// FILE: EDU.Washington.grad.gjb.cassowary
// package EDU.Washington.grad.gjb.cassowary;
(function(c){
  c.Error = c.inherit({
    description: function() {
      return "(c.Error) An error has occured in CL";
    },
    toString: function() {
      return this.description();
    }
  });

  c.ConstraintNotFound = c.inherit(c.Error, {
    description: function() {
      return "(c.ConstraintNotFound) Tried to remove a constraint never added to the tableu";
    },
  });

  c.InternalError = c.inherit(
    function(s /*String*/) {
      description_ = s;
    },
    c.Error,
    {
      description: function() {
        return "(c.InternalError) " + description_;
      },
    }
  );

  c.NonlinearExpression = c.inherit(c.Error,
    {
      description: function() {
        return "(c.NonlinearExpression) The resulting expression would be nonlinear";
      },
    }
  );

  c.NotEnoughStays = c.inherit(c.Error,
    {
      description: function() {
        return "(c.NotEnoughStays) There are not enough stays to give specific values to every variable";
      },
    }
  );

  c.RequiredFailure = c.inherit(c.Error, {
    description: function() {
      return "(c.RequiredFailure) A required constraint cannot be satisfied";
    },
  });

  c.TooDifficult = c.inherit(c.Error, {
    description: function() {
      return "(c.TooDifficult) The constraints are too difficult to solve";
    },
  });
})(CL);
