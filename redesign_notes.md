The current Cassowary API uses an inheritance hierarchy that looks like for the important, dependent types:

```js
c.AbstractConstraint = c.inherit({ });
  c.EditConstraint =    c.inherit({ extends: c.AbstractConstraint });
  c.StayConstraint =    c.inherit({ extends: c.AbstractConstraint });
  c.Constraint =        c.inherit({ extends: c.AbstractConstraint });
    c.Inequality =        c.inherit({ extends: c.Constraint });
    c.Equation =          c.inherit({ extends: c.Constraint });

c.Expression =        c.inherit({ }); // uses Variables via terms

c.Tableau =           c.inherit({ });
  c.SimplexSolver =     c.inherit({ extends: c.Tableau });

c.AbstractVariable =  c.inherit({ });
  c.Variable =          c.inherit({ extends: c.AbstractVariable });
  c.DummyVariable =     c.inherit({ extends: c.AbstractVariable });
  c.ObjectiveVariable = c.inherit({ extends: c.AbstractVariable });
  c.SlackVariable =     c.inherit({ extends: c.AbstractVariable });
```

This creates problems when methods expect cross-linkages that aren't expressed in the hierarchy or the construction patterns. For example:

```js
c.Expression = c.inherit({
  // ...

  addExpression: function(expr /*c.Expression*/,
                          n /*double*/,
                          subject /*c.AbstractVariable*/,
                          solver /*c.Tableau*/) {
    if (expr instanceof c.AbstractVariable) {
      expr = c.Expression.fromVariable(expr);
    }
    n = checkNumber(n, 1);
    this.constant += (n * expr.constant);
    expr.terms.each(function(clv, coeff) {
      this.addVariable(clv, coeff * n, subject, solver);
    }, this);
    return this;
  },

  // ...
});
```

or:

```js
c.Expression = c.inherit({
  // ...

  substituteOut: function(outvar  /*c.AbstractVariable*/,
                          expr    /*c.Expression*/,
                          subject /*c.AbstractVariable*/,
                          solver  /*ClTableau*/) {

    if (!solver) {
      throw new c.InternalError("substituteOut called without a solver");
    }

    var setVariable = this.setVariable.bind(this);
    var terms = this.terms;
    var multiplier = terms.get(outvar);
    terms.delete(outvar);
    this.constant += (multiplier * expr.constant);

    expr.terms.each(function(clv, coeff) {
      var oldCoefficient = terms.get(clv);
      if (oldCoefficient) {
        var newCoefficient = oldCoefficient + multiplier * coeff;
        if (c.approx(newCoefficient, 0)) {
          solver.noteRemovedVariable(clv, subject);
          terms.delete(clv);
        } else {
          setVariable(clv, newCoefficient);
        }
      } else {
        setVariable(clv, multiplier * coeff);
        if (solver) {
          solver.noteAddedVariable(clv, subject);
        }
      }
    });
  },

  // ...
});
```

It's clearly the case that expressions are _dependent_ data types of Solvers.

This isn't reflected in how they're constructed, however:

```js
// From Expression-test.js
describe('c.Expression', function () {
  it('is constructable with 3 variables as arguments', function () {
    var x = new c.Variable({ name: 'x', value: 167 });
    var e = new c.Expression(x, 2, 3);
    assert.deepEqual(e+'', '3 + 2*167');
  });

  // ...
});
```

Not a solver in sight! This despite the fact that in real-world usage, many of the most important methods of `c.Expression` are nonsensical (or and perhaps would fail) without reference to a solver.

This further exascerbates a pre-existing conceptual muddle in the API: variables should logically only belong to a single solver as they are mutated by that solver in the process of resolution. Users who native take a JS expression or Variable object and add them to mutliple solvers are likely to be astonished at the errors they obesrve.

That these issues tend not to arise frequently in practice is likely due to a small community and lack of confused example code. That latter situation is unlikely to persist if the first ever changes.

What's needed, instead, is a way to rationalize the creation and vending of variables, expressions, and equations.

Given JavaScript's lack of flexibility regarding scoping primitives, operator overloading, etc., the resulting API will likely need to be solver-oriented in the extreme. We might imagine:

```
// Retreive a reference to a solver (instanceof c.SimplexSolver or a facade).
var solver = new c.get("solver name");

// Add a variable to the solver
solver.var(/*required*/ name", /*opt value*/ 10);

// Retrieve the current value of the variable
solver.value(/*required*/ name") == 10;

// This style of API starts with "expr()" and builds until it reaches a
// terminal: either an "eq()", "leq()", "geq()", or "neq()"
solver.expr(/*opt name*/).var("name").plus(10).eq(15);

// Expressions may be referenced by name at expression construction time:
solver.expr(/*opt name*/).expr("name").plus(10).eq(15);
```

Internally, the existing `Expression` type appears to handle this sort of thing in a relatively inefficient but functional way (cloning the expression and adding variables/expressions). This needn't change, however the existing API surface which allows one to directly create instances of `Expression`, `Variable`, `Constraint`, `Inequality`, and `Equation` needs to be removed (or at least made hard to get to).

This new arrangement will enable a direct relationship between variables, expressions, and solvers.

This, in turn, will lead to singificant opportunities to enhance the performance of the system. For example, large amounts of time are currently spent in `c.SimplexSolver::_setExternalVariables`. The primary reason for this is that it isn't clear to the solver when a value associated with an external variable has been updated in the process of solving. Today, that work is done in `c.Expression::setVariable()`. A short-term fix to improve the performace here will be to attach solvers to `c.Expression` instances, but this will nearly always feel like a hack until/unless the process of creating/adding all `c.Expression` objects is under the control of a system that can enforce the layering relationships.

Further opportunities exist to remove the de-opting polymorphicness in many of the constructors.