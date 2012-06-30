// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
var t = c.Tableau;
var tp = t.prototype;
var epsilon = 1e-8;

c.SimplexSolver = c.inherit({
  extends: c.Tableau, 
  initialize: function(){

    c.Tableau.call(this);
    this._stayMinusErrorVars = [];
    this._stayPlusErrorVars = [];

    this._errorVars = new c.HashTable(); // cn -> Set of cv

    this._markerVars = new c.HashTable(); // cn -> Set of cv

    // this._resolve_pair = [0, 0]; 
    this._objective = new c.ObjectiveVariable("Z");

    this._editVarMap = new c.HashTable(); // cv -> c.EditInfo
    this._editVarList = [];

    this._slackCounter = 0;
    this._artificialCounter = 0;
    this._dummyCounter = 0;
    this.autoSolve = true;
    this._fNeedsSolving = false;

    this.rows = new c.HashTable(); // cv -> expression

    this.rows.set(this._objective, new c.Expression());
    this._stkCedcns = [0]; // Stack
    if (c.trace)
      c.traceprint("objective expr == " + this.rowExpression(this._objective));
  },

  addLowerBound: function(v /*c.AbstractVariable*/, lower /*double*/) {
    var cn = new c.Inequality(v, c.GEQ, new c.Expression(lower));
    return this.addConstraint(cn);
  },

  addUpperBound: function(v /*c.AbstractVariable*/, upper /*double*/) {
    var cn = new c.Inequality(v, c.LEQ, new c.Expression(upper));
    return this.addConstraint(cn);
  },

  addBounds: function(v /*c.AbstractVariable*/, lower /*double*/, upper /*double*/) {
    this.addLowerBound(v, lower);
    this.addUpperBound(v, upper);
    return this;
  },

  add: function(/*c.Constraint, ...*/) {
    for (var x = 0; x < arguments.length; x++) {
      this.addConstraint(arguments[x]);
    }
    return this;
  },

  addConstraint: function(cn /*c.Constraint*/) {
    // console.log("addConstraint: " + cn);
    if (c.trace) c.fnenterprint("addConstraint: " + cn);
    var eplus_eminus = new Array(2);
    var prevEConstant = new Array(1); // so it can be output to
    var expr = this.newExpression(cn, /*output to*/ eplus_eminus, prevEConstant);
    prevEConstant = prevEConstant[0];
    // console.log("prevEConstant: " + prevEConstant);
    var fAddedOkDirectly = false;

    fAddedOkDirectly = this.tryAddingDirectly(expr);
    if (!fAddedOkDirectly) {
      this.addWithArtificialVariable(expr);
    }

    this._fNeedsSolving = true;
    if (cn.isEditConstraint) {
      var i = this._editVarMap.size();
      var cvEplus = /* c.SlackVariable */eplus_eminus[0];
      var cvEminus = /* c.SlackVariable */eplus_eminus[1];
      if (!cvEplus instanceof c.SlackVariable) {
        console.log("cvEplus not a slack variable = " + cvEplus);
      }
      if (!cvEminus instanceof c.SlackVariable) {
        console.log("cvEminus not a slack variable = " + cvEminus);
      }
      // console.log("new c.EditInfo(" + cn + ", " + cvEplus + ", " + 
      //                               + cvEminus + ", " + prevEConstant + ", " 
      //                               + i +")");
      var ei = new c.EditInfo(cn, cvEplus, cvEminus, prevEConstant, i)
      this._editVarMap.set(cn.variable, ei);
      this._editVarList[i] = { v: cn.variable, info: ei };
    }
    if (this.autoSolve) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }
    return this;
  },

  addConstraintNoException: function(cn /*c.Constraint*/) {
    if (c.trace) c.fnenterprint("addConstraintNoException: " + cn);
    // FIXME(slightlyoff): change this to enable chaining
    try {
      this.addConstraint(cn);
      return true;
    } catch (e /*ExCLRequiredFailure*/){
      return false;
    }
  },

  addEditVar: function(v /*c.Variable*/, strength /*c.Strength*/) {
    if (c.trace) c.fnenterprint("addEditVar: " + v + " @ " + strength);
    return this.addConstraint(
        new c.EditConstraint(v, strength || c.Strength.strong));
  },

  removeEditVar: function(v /*c.Variable*/) {
    return this.removeConstraint(this._editVarMap.get(v).constraint);
  },

  beginEdit: function() {
    c.Assert(this._editVarMap.size() > 0, "_editVarMap.size() > 0");
    this._infeasibleRows.clear();
    this._resetStayConstants();
    this._stkCedcns.push(this._editVarMap.size());
    return this;
  },

  endEdit: function() {
    c.Assert(this._editVarMap.size() > 0, "_editVarMap.size() > 0");
    this.resolve();
    this._stkCedcns.pop();
    var n = this._stkCedcns[this._stkCedcns.length - 1]; // top
    this.removeEditVarsTo(n);
    return this;
  },

  removeAllEditVars: function() {
    return this.removeEditVarsTo(0);
  },

  removeEditVarsTo: function(n /*int*/) {
    try {
      var evll = this._editVarList.length;
      for(var x = n; x < evll; x++) {
        if (this._editVarList[x]) {
          this.removeEditVar(this._editVarList[x].v);
        }
      }
      this._editVarList.length = n;
      c.Assert(this._editVarMap.size() == n, "_editVarMap.size() == n");
      return this;
    }
    catch (e /*Exc.ConstraintNotFound*/){
      throw new c.InternalError("Constraint not found in removeEditVarsTo");
    }
  },

  addPointStays: function(listOfPoints /*Vector*/) {
    if (c.trace) c.fnenterprint("addPointStays" + listOfPoints);
    listOfPoints.forEach(function(p, idx) {
      this.addPointStay(p, Math.pow(2, idx));
    }, this);
    return this;
  },

  addPointStay: function(a1, a2, a3) {
    if (a1 instanceof c.Point) {
      var clp = a1, weight = a2;
      this.addStay(clp.X(), c.Strength.weak, weight || 1);
      this.addStay(clp.Y(), c.Strength.weak, weight || 1);
    } else { // 
      var vx = a1, vy = a2, weight = a3;
      this.addStay(vx, c.Strength.weak, weight || 1);
      this.addStay(vy, c.Strength.weak, weight || 1);
    }
    return this;
  },

  addStay: function(v /*c.Variable*/, strength /*c.Strength*/, weight /*double*/) {
    var cn = new c.StayConstraint(v,
                                  strength || c.Strength.weak,
                                  weight || 1);
    return this.addConstraint(cn);
  },

  // FIXME(slightlyoff): need a removeStay!

  removeConstraint: function(cn /*c.Constraint*/) {
    this.removeConstraintInternal(cn);
    return this;
  },

  removeConstraintInternal: function(cn /*c.Constraint*/) {
    // print("removeConstraintInternal('" + cn + "')");
    if (c.trace) c.fnenterprint("removeConstraint: " + cn);
    if (c.trace) c.traceprint(this.toString());
    this._fNeedsSolving = true;
    this._resetStayConstants();
    var zRow = this.rowExpression(this._objective);
    var eVars = /* Set */this._errorVars.get(cn);
    if (c.trace) c.traceprint("eVars == " + c.setToString(eVars));
    if (eVars != null) {
      eVars.each(function(cv) {
        var expr = this.rowExpression(cv);
        if (expr == null) {
          zRow.addVariable(cv, 
                           -cn.weight * cn.strength.symbolicWeight.toDouble(),
                           this._objective,
                           this);
        } else {
          zRow.addExpression(expr,
                             -cn.weight * cn.strength.symbolicWeight.toDouble(),
                             this._objective,
                             this);
        }
        if (c.trace) c.traceprint("now eVars == " + c.setToString(eVars));
      }, this);
    }
    var marker = this._markerVars.remove(cn);
    if (marker == null) {
      throw new Exc.ConstraintNotFound();
    }
    if (c.trace) c.traceprint("Looking to remove var " + marker);
    if (this.rowExpression(marker) == null) {
      var col = this.columns.get(marker);
      // console.log("col is:", col, "from marker:", marker);
      if (c.trace) c.traceprint("Must pivot -- columns are " + col);
      var exitVar = null;
      var minRatio = 0;
      col.each(function(v) {
        if (v.isRestricted) {
          var expr = this.rowExpression(v);
          var coeff = expr.coefficientFor(marker);
          if (c.trace) c.traceprint("Marker " + marker + "'s coefficient in " + expr + " is " + coeff);
          if (coeff < 0) {
            var r = -expr.constant / coeff;
            if (
              exitVar == null ||
              r < minRatio    ||
              (c.approx(r, minRatio) && v.hashCode() < exitVar.hashCode())
            ) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      }, this);
      if (exitVar == null) {
        if (c.trace) c.traceprint("exitVar is still null");
        col.each(function(v) {
          if (v.isRestricted) {
            var expr = this.rowExpression(v);
            var coeff = expr.coefficientFor(marker);
            var r = expr.constant / coeff;
            if (exitVar == null || r < minRatio) {
              minRatio = r;
              exitVar = v;
            }
          }
        }, this);
      }
      if (exitVar == null) {
        if (col.size() == 0) {
          this.removeColumn(marker);
        } else {
          col.escapingEach(function(v) {
            if (v != this._objective) {
              exitVar = v;
              return {brk:true};
            }
          }, this);
        }
      }
      if (exitVar != null) {
        this.pivot(marker, exitVar);
      }
    }
    if (this.rowExpression(marker) != null) {
      var expr = this.removeRow(marker);
    }

    if (eVars != null) {
      eVars.each(function(v) {
        if (v != marker) { this.removeColumn(v); }
      }, this);
    }

    if (cn.isStayConstraint) {
      if (eVars != null) {
        for (var i = 0; i < this._stayPlusErrorVars.length; i++) {
          eVars.remove(this._stayPlusErrorVars[i]);
          eVars.remove(this._stayMinusErrorVars[i]);
        }
      }
    } else if (cn.isEditConstraint) {
      c.Assert(eVars != null, "eVars != null");
      var cei = this._editVarMap.get(cn.variable);
      this.removeColumn(cei.editMinus);
      this._editVarMap.remove(cn.variable);
    }

    if (eVars != null) {
      this._errorVars.remove(eVars);
    }

    if (this.autoSolve) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }

    return this;
  },

  reset: function() {
    if (c.trace) c.fnenterprint("reset");
    throw new c.InternalError("reset not implemented");
  },

  resolveArray: function(newEditConstants) {
    if (c.trace) c.fnenterprint("resolveArray" + newEditConstants);
    var l = newEditConstants.length
    this._editVarMap.each(function(v, cei) {
      var i = cei.index;
      if (i < l) 
        this.suggestValue(v, newEditConstants[i]);
    }, this);
    this.resolve();
  },

  resolvePair: function(x /*double*/, y /*double*/) {
    this.suggestValue(this._editVarList[0].v, x);
    this.suggestValue(this._editVarList[1].v, y);
    this.resolve();
  },

  resolve: function() {
    if (c.trace) c.fnenterprint("resolve()");
    this.dualOptimize();
    this._setExternalVariables();
    this._infeasibleRows.clear();
    this._resetStayConstants();
  },

  suggestValue: function(v /*c.Variable*/, x /*double*/) {
    if (c.trace) c.fnenterprint("suggestValue(" + v + ", " + x + ")");
    var cei = this._editVarMap.get(v);
    if (cei == null) {
      throw new c.Error("suggestValue for variable " + v + ", but var is not an edit variable");
    }
    var delta = x - cei.prevEditConstant;
    cei.prevEditConstant = x;
    this.deltaEditConstant(delta, cei.editPlus, cei.editMinus);
    return this;
  },

  solve: function() {
    if (this._fNeedsSolving) {
      this.optimize(this._objective);
      this._setExternalVariables();
    }
    return this;
  },

  setEditedValue: function(v /*c.Variable*/, n /*double*/) {
    if (!(this.columnsHasKey(v) || (this.rowExpression(v) != null))) {
      v._value = n;
      return this;
    }

    if (!c.approx(n, v.value())) {
      this.addEditVar(v);
      this.beginEdit();

      try {
        this.suggestValue(v, n);
      } catch (e /*c.Error*/) {
        throw new c.InternalError("Error in setEditedValue");
      }

      this.endEdit();
    }
    return this;
  },

  addVar: function(v /*c.Variable*/) {
    if (!(this.columnsHasKey(v) || (this.rowExpression(v) != null))) {
      try {
        this.addStay(v);
      } catch (e /*c.RequiredFailure*/){
        throw new c.InternalError("Error in addVar -- required failure is impossible");
      }

      if (c.trace) {
        c.traceprint("added initial stay on " + v);
      }
    }
    return this;
  },

  getInternalInfo: function() {
    var retstr = tp.getInternalInfo.call(this);
    retstr += "\nSolver info:\n";
    retstr += "Stay Error Variables: ";
    retstr += this._stayPlusErrorVars.length + this._stayMinusErrorVars.length;
    retstr += " (" + this._stayPlusErrorVars.length + " +, ";
    retstr += this._stayMinusErrorVars.length + " -)\n";
    retstr += "Edit Variables: " + this._editVarMap.size();
    retstr += "\n";
    return retstr;
  },

  getDebugInfo: function() {
    return this.toString() + this.getInternalInfo() + "\n";
  },

  toString: function() {
    var bstr = tp.getInternalInfo.call(this);
    bstr += "\n_stayPlusErrorVars: ";
    bstr += '[' + this._stayPlusErrorVars + ']';
    bstr += "\n_stayMinusErrorVars: ";
    bstr += '[' + this._stayMinusErrorVars + ']';
    bstr += "\n";
    bstr += "_editVarMap:\n" + c.hashToString(this._editVarMap);
    bstr += "\n";
    return bstr;
  },

  getConstraintMap: function() {
    return this._markerVars;
  },

  addWithArtificialVariable: function(expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("addWithArtificialVariable: " + expr);
    var av = new c.SlackVariable(++this._artificialCounter, "a");
    var az = new c.ObjectiveVariable("az");
    var azRow = /* c.Expression */expr.clone();
    if (c.trace) c.traceprint("before addRows:\n" + this);
    this.addRow(az, azRow);
    this.addRow(av, expr);
    if (c.trace) c.traceprint("after addRows:\n" + this);
    this.optimize(az);
    var azTableauRow = this.rowExpression(az);
    if (c.trace) c.traceprint("azTableauRow.constant == " + azTableauRow.constant);
    if (!c.approx(azTableauRow.constant, 0)) {
      this.removeRow(az);
      this.removeColumn(av);
      throw new c.RequiredFailure();
    }
    var e = this.rowExpression(av);
    if (e != null) {
      if (e.isConstant()) {
        this.removeRow(av);
        this.removeRow(az);
        return;
      }
      var entryVar = e.anyPivotableVariable();
      this.pivot(entryVar, av);
    }
    c.Assert(this.rowExpression(av) == null, "rowExpression(av) == null");
    this.removeColumn(av);
    this.removeRow(az);
  },

  tryAddingDirectly: function(expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("tryAddingDirectly: " + expr);
    var subject = this.chooseSubject(expr);
    if (subject == null) {
      if (c.trace) c.fnexitprint("returning false");
      return false;
    }
    expr.newSubject(subject);
    if (this.columnsHasKey(subject)) {
      this.substituteOut(subject, expr);
    }
    this.addRow(subject, expr);
    if (c.trace) c.fnexitprint("returning true");
    return true;
  },

  chooseSubject: function(expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("chooseSubject: " + expr);
    var subject = null;
    var foundUnrestricted = false;
    var foundNewRestricted = false;
    var terms = expr.terms;
    var rv = terms.escapingEach(function(v, c) {
      if (foundUnrestricted) {
        if (!v.isRestricted) {
          if (!this.columnsHasKey(v)) {
            return {retval: v};
          }
        }
      } else {
        if (v.isRestricted) {
          if (!foundNewRestricted && !v.isDummy && c < 0) {
            var col = this.columns.get(v);
            if (col == null || (col.size() == 1 && this.columnsHasKey(this._objective))) {
              subject = v;
              foundNewRestricted = true;
            }
          }
        } else {
          subject = v;
          foundUnrestricted = true;
        }
      }
    }, this);
    if (rv && rv.retval !== undefined) return rv.retval;

    if (subject != null) 
      return subject;

    var coeff = 0;

    // subject is nil. 
    // Make one last check -- if all of the variables in expr are dummy
    // variables, then we can pick a dummy variable as the subject
    var rv = terms.escapingEach(function(v,c) {
      if (!v.isDummy)  {
        return {retval:null};
      }
      if (!this.columnsHasKey(v)) {
        subject = v;
        coeff = c;
      }
    }, this);
    if (rv && rv.retval !== undefined) return rv.retval;

    if (!c.approx(expr.constant, 0)) {
      throw new c.RequiredFailure();
    }
    if (coeff > 0) {
      expr.multiplyMe(-1);
    }
    return subject;
  },

  deltaEditConstant: function(delta /*double*/, 
                              plusErrorVar /*c.AbstractVariable*/, 
                              minusErrorVar /*c.AbstractVariable*/) {
    if (c.trace) 
      c.fnenterprint("deltaEditConstant :" + delta + ", " + plusErrorVar + ", " + minusErrorVar);

    var exprPlus = this.rowExpression(plusErrorVar);
    if (exprPlus != null) {
      exprPlus.constant += delta;
      if (exprPlus.constant < 0) {
        this._infeasibleRows.add(plusErrorVar);
      }
      return;
    }
    var exprMinus = this.rowExpression(minusErrorVar);
    if (exprMinus != null) {
      exprMinus.constant += -delta;
      if (exprMinus.constant < 0) {
        this._infeasibleRows.add(minusErrorVar);
      }
      return;
    }
    var columnVars = this.columns.get(minusErrorVar);
    if (!columnVars) {
      console.log("columnVars is null -- tableau is:\n" + this);
    }
    columnVars.each(function(basicVar) {
      var expr = this.rowExpression(basicVar);
      var c = expr.coefficientFor(minusErrorVar);
      expr.constant += (c * delta);
      if (basicVar.isRestricted && expr.constant < 0) {
        this._infeasibleRows.add(basicVar);
      }
    }, this);
  },

  dualOptimize: function() {
    if (c.trace) c.fnenterprint("dualOptimize:");
    var zRow = this.rowExpression(this._objective);
    while (this._infeasibleRows.size()) {
      var exitVar = this._infeasibleRows.values()[0];
      this._infeasibleRows.remove(exitVar);
      var entryVar = null;
      var expr = this.rowExpression(exitVar);
      if (expr != null) {
        if (expr.constant < 0) {
          var ratio = Number.MAX_VALUE;
          var r;
          var terms = expr.terms;
          terms.each(function(v, cd) {
            if (cd > 0 && v.isPivotable) {
              var zc = zRow.coefficientFor(v);
              r = zc / cd;
              if (r < ratio || (c.approx(r, ratio) && v.hashCode() < entryVar.hashCode())) {
                entryVar = v;
                ratio = r;
              }
            }
          });
          if (ratio == Number.MAX_VALUE) {
            throw new c.InternalError("ratio == nil (MAX_VALUE) in dualOptimize");
          }
          this.pivot(entryVar, exitVar);
        }
      }
    }
  },

  newExpression: function(cn /*c.Constraint*/, /** outputs to **/
                          eplus_eminus /*Vector*/, prevEConstant /*ClDouble*/) {
    if (c.trace) {
      c.fnenterprint("newExpression: " + cn);
      c.traceprint("cn.isInequality == " + cn.isInequality);
      c.traceprint("cn.isRequired() == " + cn.isRequired());
    }
    var cnExpr = cn.expression;
    var expr = new c.Expression(cnExpr.constant);
    var slackVar = new c.SlackVariable();
    var dummyVar = new c.DummyVariable();
    var eminus = new c.SlackVariable();
    var eplus = new c.SlackVariable();
    var cnTerms = cnExpr.terms;
    // console.log(cnTerms.size());

    cnTerms.each(function(v, c) {
      var e = this.rowExpression(v);
      if (!e) {
        expr.addVariable(v, c);
      } else {
        expr.addExpression(e, c);
      }
    }, this);

    if (cn.isInequality) {
      if (c.trace) c.traceprint("Inequality, adding slack");
      ++this._slackCounter;
      slackVar = new c.SlackVariable(this._slackCounter, "s");
      expr.setVariable(slackVar, -1);
      this._markerVars.set(cn, slackVar);
      if (!cn.isRequired()) {
        ++this._slackCounter;
        eminus = new c.SlackVariable(this._slackCounter, "em");
        expr.setVariable(eminus, 1);
        var zRow = this.rowExpression(this._objective);
        var sw = cn.strength.symbolicWeight.times(cn.weight);
        zRow.setVariable(eminus, sw.toDouble());
        this.insertErrorVar(cn, eminus);
        this.noteAddedVariable(eminus, this._objective);
      }
    } else {
      if (cn.isRequired()) {
        if (c.trace) c.traceprint("Equality, required");
        ++this._dummyCounter;
        dummyVar = new c.DummyVariable(this._dummyCounter, "d");
        expr.setVariable(dummyVar, 1);
        this._markerVars.set(cn, dummyVar);
        if (c.trace) c.traceprint("Adding dummyVar == d" + this._dummyCounter);
      } else {
        if (c.trace) c.traceprint("Equality, not required");
        ++this._slackCounter;
        eplus = new c.SlackVariable(this._slackCounter, "ep");
        eminus = new c.SlackVariable(this._slackCounter, "em");
        expr.setVariable(eplus, -1);
        expr.setVariable(eminus, 1);
        this._markerVars.set(cn, eplus);
        var zRow = this.rowExpression(this._objective);
        if (c.trace) console.log(zRow);
        var sw = cn.strength.symbolicWeight.times(cn.weight);
        var swCoeff = sw.toDouble();
        if (swCoeff == 0) {
          if (c.trace) c.traceprint("sw == " + sw);
          if (c.trace) c.traceprint("cn == " + cn);
          if (c.trace) c.traceprint("adding " + eplus + " and " + eminus + " with swCoeff == " + swCoeff);
        }
        zRow.setVariable(eplus, swCoeff);
        this.noteAddedVariable(eplus, this._objective);
        zRow.setVariable(eminus, swCoeff);
        this.noteAddedVariable(eminus, this._objective);
        this.insertErrorVar(cn, eminus);
        this.insertErrorVar(cn, eplus);
        if (cn.isStayConstraint) {
          this._stayPlusErrorVars.push(eplus);
          this._stayMinusErrorVars.push(eminus);
        } else if (cn.isEditConstraint) {
          eplus_eminus[0] = eplus;
          eplus_eminus[1] = eminus;
          prevEConstant[0] = cnExpr.constant;
        }
      }
    }
    if (expr.constant < 0) expr.multiplyMe(-1);
    if (c.trace) c.fnexitprint("returning " + expr);
    return expr;
  },

  optimize: function(zVar /*c.ObjectiveVariable*/) {
    if (c.trace) c.fnenterprint("optimize: " + zVar);
    if (c.trace) c.traceprint(this.toString());

    var zRow = this.rowExpression(zVar);
    c.Assert(zRow != null, "zRow != null");
    var entryVar = null;
    var exitVar = null;

    while (true) {
      var objectiveCoeff = 0;
      var terms = zRow.terms;

      terms.escapingEach(function(v, c) {
        if (v.isPivotable && c < objectiveCoeff) {
          objectiveCoeff = c;
          entryVar = v;
          // Break on success
          return { brk: 1 };
        }
      }, this);

      if (objectiveCoeff >= -epsilon)
        return;

      if (c.trace) {
        c.traceprint("entryVar == " + entryVar + ", objectiveCoeff == " + objectiveCoeff);
      }

      var minRatio = Number.MAX_VALUE;
      var columnVars = this.columns.get(entryVar);
      var r = 0;

      columnVars.each(function(v) {
        if (c.trace) c.traceprint("Checking " + v);
        if (v.isPivotable) {
          var expr = this.rowExpression(v);
          var coeff = expr.coefficientFor(entryVar);
          if (c.trace) c.traceprint("pivotable, coeff = " + coeff);
          if (coeff < 0) {
            r = -expr.constant / coeff;
            if (r < minRatio || (c.approx(r, minRatio) && v.hashCode() < exitVar.hashCode())) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      }, this);

      if (minRatio == Number.MAX_VALUE) {
        throw new c.InternalError("Objective function is unbounded in optimize");
      }

      this.pivot(entryVar, exitVar);

      if (c.trace) c.traceprint(this.toString());
    }
  },

  pivot: function(entryVar /*c.AbstractVariable*/, exitVar /*c.AbstractVariable*/) {
    if (c.trace) c.fnenterprint("pivot: " + entryVar + ", " + exitVar);
    if (entryVar == null) {
      console.warn("pivot: entryVar == null");
    }
    if (exitVar == null) {
      console.warn("pivot: exitVar == null");
    }
    var pexpr = this.removeRow(exitVar);
    pexpr.changeSubject(exitVar, entryVar);
    this.substituteOut(entryVar, pexpr);
    this.addRow(entryVar, pexpr);
  },

  _resetStayConstants: function() {
    if (c.trace) c.fnenterprint("_resetStayConstants");
    for (var i = 0; i < this._stayPlusErrorVars.length; i++) {
      var expr = this.rowExpression(/* c.AbstractVariable */this._stayPlusErrorVars[i]);
      if (expr == null)
        expr = this.rowExpression(/* c.AbstractVariable */this._stayMinusErrorVars[i]);
      if (expr != null)
        expr.constant = 0;
    }
  },

  _setExternalVariables: function() {
    if (c.trace) c.fnenterprint("_setExternalVariables:");
    if (c.trace) c.traceprint(this.toString());

    this._externalParametricVars.each(function(v) {
      if (this.rowExpression(v) != null) {
        console.log("Error: variable" + v + " in _externalParametricVars is basic");
      } else {
        v._value = 0;
      }
    }, this);
    this._externalRows.each(function(v) {
      var expr = this.rowExpression(v);
      if (c.trace) c.debugprint("v == " + v);
      if (c.trace) c.debugprint("expr == " + expr);
      v._value = expr.constant;
    }, this);
    this._fNeedsSolving = false;
    this.onsolved();
  },

  onsolved: function() {
    // Lifecycle stub. Here for dirty, dirty monkey patching.
  },

  insertErrorVar: function(cn /*c.Constraint*/, aVar /*c.AbstractVariable*/) {
    if (c.trace) c.fnenterprint("insertErrorVar:" + cn + ", " + aVar);
    var cnset = /* Set */this._errorVars.get(aVar);
    var cnsetRes;
    if (!cnset) {
      cnsetRes = new c.HashSet();
      this._errorVars.set(cn, cnsetRes);
    } else {
      cnsetRes = cnset;
    }
    cnsetRes.add(aVar);
  },
});
})(c);
