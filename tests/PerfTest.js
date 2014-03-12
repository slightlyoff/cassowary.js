// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

(function(c){
"use strict";

var PerfTest = c.inherit({

  grainedUniformRandom: function() {
    var grain = 1.0e-4;
    return ((Math.random() / grain) * grain);
    // return ((0.5 / grain) * grain);
  },

  randomInRange: function(low /*int*/, high /*int*/) {
    return Math.floor((Math.random() * (high - low + 1)) + low);
    // return Math.floor((0.5 * (high - low + 1)) + low);
  },

  addDelSolvers: function(nCns /*int*/,
                          nResolves /*int*/,
                          nSolvers /*int*/,
                          testNum /*int*/) {
    var totalTimer = new c.Timer();
    totalTimer.start();

    var timer = new c.Timer();
    var tmAddvar, tmEditvar, tmResolvevar, tmEndEdit;
    var tmAdd, tmEdit, tmResolve;
    var ineqProb = 0.12;
    var maxVars = 3;
    var nVars = nCns;
    print("starting timing test. nCns = " + nCns + ", nSolvers = " + nSolvers + ", nResolves = " + nResolves);
    timer.start();
    var rgsolvers = new Array(nSolvers+1);
    for (var is = 0; is < nSolvers + 1; ++is) {
      rgsolvers[is] = new c.SimplexSolver();
      rgsolvers[is].autoSolve = false;
    }
    var rgpclv = new Array(nVars+1);
    for (var i = 0; i < nVars + 1; ++i) {
      rgpclv[i] = new c.Variable({ name: i, prefix: "x" });
      for (var is = 0; is < nSolvers + 1; ++is) {
        rgsolvers[is].addStay(rgpclv[i]);
      }
    }
    var nCnsMade = nCns * 5;
    var rgpcns = new Array(nCnsMade); // ClConstraints
    var rgpcnsAdded = new Array(nCns); // ClConstraint
    var nvs = 0;
    var k;
    var j;
    var coeff;
    for (j = 0; j < nCnsMade; ++j) {
      nvs = this.randomInRange(1, maxVars);
      if (this.trace) this.traceprint("Using nvs = " + nvs);
      var expr = c.Expression.fromConstant(
                                    this.grainedUniformRandom() * 20.0 - 10.0);
      for (k = 0; k < nvs; k++) {
        coeff = this.grainedUniformRandom() * 10 - 5;
        var iclv = this.randomInRange(0, nVars);
        expr.addExpression(c.times(rgpclv[iclv], coeff));
      }
      if (Math.random() < ineqProb) {
        rgpcns[j] = new c.Inequality(expr);
      } else {
        rgpcns[j] = new c.Equation(expr);
      }
      if (this.trace) this.traceprint("Constraint " + j + " is " + rgpcns[j]);
    }
    timer.stop();
    print("done building data structures");
    print("time = " + timer.elapsedTime());
    for (var is = 0; is < nSolvers; ++is) {
      var cCns = 0;
      var cExceptions = 0;
      var solver = rgsolvers[nSolvers];
      cExceptions = 0;
      for (j = 0; j < nCnsMade && cCns < nCns; j++) {
        try {
          if (null != rgpcns[j]) {
            solver.addConstraint(rgpcns[j]);
            ++cCns;
          }
        } catch (err /*ExCLRequiredFailure*/) {
          cExceptions++;
          rgpcns[j] = null;
        }
      }
    }
    timer.reset();
    timer.start();
    for (var is = 0; is < nSolvers; ++is) {
      var cCns = 0;
      var cExceptions = 0;
      var solver = rgsolvers[is];
      for (j = 0; j < nCnsMade && cCns < nCns; j++) {
        try {
          if (null != rgpcns[j]) {
            solver.addConstraint(rgpcns[j]);
            ++cCns;
          }
        } catch (err /*ExCLRequiredFailure*/) {
          cExceptions++;
          rgpcns[j] = null;
        }
      }
      print("done adding " + cCns + " constraints [" + j + " attempted, " + cExceptions + " exceptions]");
      solver.solve();
      print("time = " + timer.elapsedTime());
    }
    timer.stop();
    tmAdd = timer.elapsedTime();
    var e1Index = this.randomInRange(0, nVars);
    var e2Index = this.randomInRange(0, nVars);
    print("Editing vars with indices " + e1Index + ", " + e2Index);
    var edit1 = new c.EditConstraint(rgpclv[e1Index], c.Strength.strong);
    var edit2 = new c.EditConstraint(rgpclv[e2Index], c.Strength.strong);
    print("about to start resolves");
    timer.reset();
    timer.start();
    rgsolvers.forEach(function(solver) {
      solver.addConstraint(edit1).addConstraint(edit2);
    });
    timer.stop();
    tmEdit = timer.elapsedTime();
    timer.reset().start();
    rgsolvers.forEach(function(solver) {
      for (var m = 0; m < nResolves; m++) {
        solver.resolvePair(rgpclv[e1Index].value * 1.001,
                           rgpclv[e2Index].value * 1.001);
      }
    });
    timer.stop();
    tmResolve = timer.elapsedTime();
    print("done resolves -- now ending edits");
    timer.reset().start();
    for (var is = 0; is < nSolvers; ++is) {
      rgsolvers[is].removeConstraint(edit1).removeConstraint(edit2);
    }
    timer.stop();
    tmEndEdit = timer.elapsedTime();

    totalTimer.stop();
    print("total time = " + totalTimer.elapsedTime());

    var s = "\n  ";
    var mspersec = 1000;
    print(s +
          "number of constraints: \t\t" + nCns + s +
          "number of solvers: \t\t\t" + nSolvers + s +
          "numbers of resolves: \t\t\t" + nResolves + s +
          "tests: \t\t\t\t" + testNum + s +
          "time to add (ms): \t\t\t" + tmAdd * mspersec + s +
          "time to edit (ms): \t\t\t" + tmEdit * mspersec + s +
          "time to resolve (ms): \t\t" + tmResolve * mspersec + s +
          "time to edit (ms): \t\t\t" + tmEndEdit * mspersec + s +
          "add time per solver (ms): \t\t" + tmAdd / nCns / nSolvers * mspersec + s +
          "edit time per solver (ms): \t\t" + tmEdit / nSolvers / 2 * mspersec + s +
          "resolve time per resolve (ms): \t" + tmResolve / nResolves / nSolvers * mspersec + s +
          "time to end edits per solver (ms): \t" + tmEndEdit / nSolvers / 2 * mspersec);
    return true;
  },

  main: function(testNum, constraints, solvers, resolves) {
    var fResult;
    testNum  =        testNum || 1;
    constraints = constraints || 900;
    resolves =       resolves || 100;
    solvers  =        solvers || 10;
    this.addDelSolvers(constraints, resolves, solvers, testNum);
  },
});

(new PerfTest()).main(1, 1000, 1, 1000);
// (new PerfTest()).main(1, 500, 10, 500);

//clt.main(new Array());
})(this["c"]||module.parent.exports||{});
