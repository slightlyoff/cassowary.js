// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

(function(c) {
var t = c.Tableau;
var tp = t.prototype;

c.SimplexSolver = c.inherit({
  extends: c.Tableau, 
  initialize: function(){
    /* FIELDS:
        var _stayMinusErrorVars //Vector
        var _stayPlusErrorVars //Vector
        var _errorVars //SimpleHashtable
        var _markerVars //SimpleHashtable
        var _objective //c.ObjectiveVariable
        var _editVarMap //SimpleHashtable
        var _slackCounter //long
        var _artificialCounter //long
        var _dummyCounter //long
        var _resolve_pair //Vector
        var _epsilon //double
        var _fOptimizeAutomatically //boolean
        var _fNeedsSolving //boolean
        var _stkCedcns //Stack
    */

    CL.Tableau.call(this);
    this._stayMinusErrorVars = [];
    this._stayPlusErrorVars = [];

    this._errorVars = new SimpleHashtable(); // cn -> Set of clv

    this._markerVars = new SimpleHashtable(); // cn -> Set of clv

    this._resolve_pair = [0, 0]; 
    this._objective = new c.ObjectiveVariable("Z");

    this._editVarMap = new SimpleHashtable(); // clv -> c.EditInfo

    this._slackCounter = 0;
    this._artificialCounter = 0;
    this._dummyCounter = 0;
    this._epsilon = 1e-8;
    this._fOptimizeAutomatically = true;
    this._fNeedsSolving = false;

    this._rows = new SimpleHashtable(); // clv -> expression

    this._rows.put(this._objective, new c.LinearExpression());
    this._stkCedcns = []; // Stack
    this._stkCedcns.push(0);
    if (CL.trace)
      CL.traceprint("objective expr == " + this.rowExpression(this._objective));
  },

  addLowerBound: function(v /*c.AbstractVariable*/, lower /*double*/) {
    var cn = new c.LinearInequality(v, CL.GEQ, new c.LinearExpression(lower));
    return this.addConstraint(cn);
  },

  addUpperBound: function(v /*c.AbstractVariable*/, upper /*double*/) {
    var cn = new c.LinearInequality(v, CL.LEQ, new c.LinearExpression(upper));
    return this.addConstraint(cn);
  },

  addBounds: function(v /*c.AbstractVariable*/, lower /*double*/, upper /*double*/) {
    this.addLowerBound(v, lower);
    this.addUpperBound(v, upper);
    return this;
  },

  addConstraint: function(cn /*c.Constraint*/) {
    // console.log("addConstraint: " + cn);
    if (CL.trace) CL.fnenterprint("addConstraint: " + cn);
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
      var clvEplus = /* c.SlackVariable */eplus_eminus[0];
      var clvEminus = /* c.SlackVariable */eplus_eminus[1];
      if (!clvEplus instanceof c.SlackVariable) {
        console.log("clvEplus not a slack variable = " + clvEplus);
      }
      if (!clvEminus instanceof c.SlackVariable) {
        console.log("clvEminus not a slack variable = " + clvEminus);
      }
      // console.log("new c.EditInfo(" + cn + ", " + clvEplus + ", " + 
      //                               + clvEminus + ", " + prevEConstant + ", " 
      //                               + i +")");
      this._editVarMap.put(cn.variable,
                           new c.EditInfo(cn, clvEplus, clvEminus, prevEConstant, i));
    }
    if (this._fOptimizeAutomatically) {
      this.optimize(this._objective);
      this.setExternalVariables();
    }
    cn.addedTo(this);
    return this;
  },

  addConstraintNoException: function(cn /*c.Constraint*/) {
    if (CL.trace) CL.fnenterprint("addConstraintNoException: " + cn);
    try {
      this.addConstraint(cn);
      return true;
    } catch (e /*ExCLRequiredFailure*/){
      return false;
    }
  },

  addEditVar: function(v /*ClVariable*/, strength /*c.Strength*/) {
    if (CL.trace) CL.fnenterprint("addEditVar: " + v + " @ " + strength);
    strength = strength || c.Strength.strong;
    var cnEdit = new c.EditConstraint(v, strength);
    return this.addConstraint(cnEdit);
  },

  removeEditVar: function(v /*ClVariable*/) {
    var cei = /* c.EditInfo */this._editVarMap.get(v);
    var cn = cei.constraint;
    this.removeConstraint(cn);
    return this;
  },

  beginEdit: function() {
    CL.Assert(this._editVarMap.size() > 0, "_editVarMap.size() > 0");
    this._infeasibleRows.clear();
    this.resetStayConstants();
    this._stkCedcns.push(this._editVarMap.size());
    return this;
  },

  endEdit: function() {
    CL.Assert(this._editVarMap.size() > 0, "_editVarMap.size() > 0");
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
      var that = this;
      this._editVarMap.each(function(v, cei) {
        if (cei.index >= n) {
          that.removeEditVar(v);
        }
      });
      CL.Assert(this._editVarMap.size() == n, "_editVarMap.size() == n");
      return this;
    }
    catch (e /*Exc.ConstraintNotFound*/){
      throw new c.InternalError("Constraint not found in removeEditVarsTo");
    }
  },

  addPointStays: function(listOfPoints /*Vector*/) {
    if (CL.trace) CL.fnenterprint("addPointStays" + listOfPoints);
    var weight = 1.0;
    var multiplier = 2.0;
    for (var i = 0; i < listOfPoints.length; i++)
    {
      this.addPointStay(/* c.Point */listOfPoints[i], weight);
      weight *= multiplier;
    }
    return this;
  },

  addPointStay: function(a1, a2, a3) {
    if (a1 instanceof c.Point) {
      var clp = a1, weight = a2;
      this.addStay(clp.X(), c.Strength.weak, weight || 1.0);
      this.addStay(clp.Y(), c.Strength.weak, weight || 1.0);
    } else { // 
      var vx = a1, vy = a2, weight = a3;
      this.addStay(vx, c.Strength.weak, weight || 1.0);
      this.addStay(vy, c.Strength.weak, weight || 1.0);
    }
    return this;
  },

  addStay: function(v /*ClVariable*/, strength /*c.Strength*/, weight /*double*/) {
    var cn = new c.StayConstraint(v, strength || c.Strength.weak, weight || 1.0);
    return this.addConstraint(cn);
  },

  removeConstraint: function(cn /*c.Constraint*/) {
    this.removeConstraintInternal(cn);
    cn.removedFrom(this);
    return this;
  },

  removeConstraintInternal: function(cn /*c.Constraint*/) {
    // print("removeConstraintInternal('" + cn + "')");
    var that = this;
    if (CL.trace) CL.fnenterprint("removeConstraint: " + cn);
    if (CL.trace) CL.traceprint(this.toString());
    this._fNeedsSolving = true;
    this.resetStayConstants();
    var zRow = this.rowExpression(this._objective);
    var eVars = /* Set */this._errorVars.get(cn);
    if (CL.trace) CL.traceprint("eVars == " + CL.setToString(eVars));
    if (eVars != null) {
      eVars.each(function(clv) {
        var expr = that.rowExpression(clv);
        if (expr == null) {
          zRow.addVariable(clv, -cn.weight * cn.strength.symbolicWeight.toDouble(), that._objective, that);
        } else {
          zRow.addExpression(expr, -cn.weight * cn.strength.symbolicWeight.toDouble(), that._objective, that);
        }
        if (CL.trace) CL.traceprint("now eVars == " + CL.setToString(eVars));
      });
    }
    var marker = this._markerVars.remove(cn);
    if (marker == null) {
      throw new Exc.ConstraintNotFound();
    }
    if (CL.trace) CL.traceprint("Looking to remove var " + marker);
    if (this.rowExpression(marker) == null) {
      var col = this._columns.get(marker);
      // console.log("col is:", col, "from marker:", marker);
      if (CL.trace) CL.traceprint("Must pivot -- columns are " + col);
      var exitVar = null;
      var minRatio = 0.0;
      col.each(function(v) {
        if (v.isRestricted) {
          var expr = that.rowExpression(v);
          var coeff = expr.coefficientFor(marker);
          if (that.trace) that.traceprint("Marker " + marker + "'s coefficient in " + expr + " is " + coeff);
          if (coeff < 0.0) {
            var r = -expr.constant / coeff;
            if (exitVar == null || r < minRatio || (CL.approx(r, minRatio) && v.hashCode() < exitVar.hashCode())) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      });
      if (exitVar == null) {
        if (CL.trace) CL.traceprint("exitVar is still null");
        col.each(function(v) {
          if (v.isRestricted) {
            var expr = that.rowExpression(v);
            var coeff = expr.coefficientFor(marker);
            var r = expr.constant / coeff;
            if (exitVar == null || r < minRatio) {
              minRatio = r;
              exitVar = v;
            }
          }
        });
      }
      if (exitVar == null) {
        if (col.size() == 0) {
          this.removeColumn(marker);
        }
        else {
          col.escapingEach(function(v) {
            if (v != that._objective) {
              exitVar = v;
              return {brk:true};
            }
          });
        }
      }
      if (exitVar != null) {
        this.pivot(marker, exitVar);
      }
    }
    if (this.rowExpression(marker) != null) {
      var expr = this.removeRow(marker);
      expr = null;
    }
    if (eVars != null) {
      eVars.each(function(v) {
        if (v != marker) {
          that.removeColumn(v);
          v = null;
        }
      });
    }
    if (cn.isStayConstraint) {
      if (eVars != null) {
        for (var i = 0; i < this._stayPlusErrorVars.length; i++)
        {
          eVars.remove(this._stayPlusErrorVars[i]);
          eVars.remove(this._stayMinusErrorVars[i]);
        }
      }
    }
    else if (cn.isEditConstraint) {
      CL.Assert(eVars != null, "eVars != null");
      var cnEdit = /* c.EditConstraint */cn;
      var clv = cnEdit.variable;
      var cei = this._editVarMap.get(clv);
      var clvEditMinus = cei.clvEditMinus;
      this.removeColumn(clvEditMinus);
      this._editVarMap.remove(clv);
    }
    if (eVars != null) {
      this._errorVars.remove(eVars);
    }
    marker = null;
    if (this._fOptimizeAutomatically) {
      this.optimize(this._objective);
      this.setExternalVariables();
    }
    return this;
  },

  reset: function() {
    if (CL.trace) CL.fnenterprint("reset");
    throw new c.InternalError("reset not implemented");
  },

  resolveArray: function(newEditConstants /*Vector*/) {
    if (CL.trace) CL.fnenterprint("resolveArray" + newEditConstants);
    var that = this;
    this._editVarMap.each(function(v, cei) {
      var i = cei.index;
      if (i < newEditConstants.length) 
        that.suggestValue(v, newEditConstants[i]);
    });
    this.resolve();
  },

  resolvePair: function(x /*double*/, y /*double*/) {
    this._resolve_pair[0] = x;
    this._resolve_pair[1] = y;
    this.resolveArray(this._resolve_pair);
  },

  resolve: function() {
    if (CL.trace) CL.fnenterprint("resolve()");
    this.dualOptimize();
    this.setExternalVariables();
    this._infeasibleRows.clear();
    this.resetStayConstants();
  },

  suggestValue: function(v /*ClVariable*/, x /*double*/) {
    if (CL.trace) CL.fnenterprint("suggestValue(" + v + ", " + x + ")");
    var cei = this._editVarMap.get(v);
    if (cei == null) {
      // console.log("suggestValue for variable " + v + ", but var is not an edit variable\n");
      throw new c.Error();
    }
    var i = cei.index;

    var clvEditPlus = cei.clvEditPlus;
    var clvEditMinus = cei.clvEditMinus;
    var delta = x - cei.prevEditConstant;
    // console.log("delta: ", delta);
    cei.prevEditConstant = x;
    this.deltaEditConstant(delta, clvEditPlus, clvEditMinus);
    return this;
  },

  setAutosolve: function(f /*boolean*/) {
    this._fOptimizeAutomatically = f;
    return this;
  },

  FIsAutosolving: function() {
    return this._fOptimizeAutomatically;
  },

  solve: function() {
    if (this._fNeedsSolving) {
      this.optimize(this._objective);
      this.setExternalVariables();
    }
    return this;
  },

  setEditedValue: function(v /*ClVariable*/, n /*double*/) {
    if (!this.FContainsVariable(v)) {
      v.change_value(n);
      return this;
    }
    if (!CL.approx(n, v.value())) {
      this.addEditVar(v);
      this.beginEdit();
      try {
        this.suggestValue(v, n);
      }
      catch (e /*ExCLError*/){
        throw new c.InternalError("Error in setEditedValue");
      }
      this.endEdit();
    }
    return this;
  },

  FContainsVariable: function(v /*ClVariable*/) {
    return this.columnsHasKey(v) || (this.rowExpression(v) != null);
  },

  addVar: function(v /*ClVariable*/) {
    if (!this.FContainsVariable(v)) {
      try {
        this.addStay(v);
      }
      catch (e /*ExCLRequiredFailure*/){
        throw new c.InternalError("Error in addVar -- required failure is impossible");
      }
      if (CL.trace) {
        CL.traceprint("added initial stay on " + v);
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
    bstr += "_editVarMap:\n" + CL.hashToString(this._editVarMap);
    bstr += "\n";
    return bstr;
  },

  getConstraintMap: function() {
    return this._markerVars;
  },

  addWithArtificialVariable: function(expr /*c.LinearExpression*/) {
    if (CL.trace) CL.fnenterprint("addWithArtificialVariable: " + expr);
    var av = new c.SlackVariable(++this._artificialCounter, "a");
    var az = new c.ObjectiveVariable("az");
    var azRow = /* c.LinearExpression */expr.clone();
    if (CL.trace) CL.traceprint("before addRows:\n" + this);
    this.addRow(az, azRow);
    this.addRow(av, expr);
    if (CL.trace) CL.traceprint("after addRows:\n" + this);
    this.optimize(az);
    var azTableauRow = this.rowExpression(az);
    if (CL.trace) CL.traceprint("azTableauRow.constant == " + azTableauRow.constant);
    if (!CL.approx(azTableauRow.constant, 0.0)) {
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
    CL.Assert(this.rowExpression(av) == null, "rowExpression(av) == null");
    this.removeColumn(av);
    this.removeRow(az);
  },

  tryAddingDirectly: function(expr /*c.LinearExpression*/) {
    if (CL.trace) CL.fnenterprint("tryAddingDirectly: " + expr);
    var subject = this.chooseSubject(expr);
    if (subject == null) {
      if (CL.trace) CL.fnexitprint("returning false");
      return false;
    }
    expr.newSubject(subject);
    if (this.columnsHasKey(subject)) {
      this.substituteOut(subject, expr);
    }
    this.addRow(subject, expr);
    if (CL.trace) CL.fnexitprint("returning true");
    return true;
  },

  chooseSubject: function(expr /*c.LinearExpression*/) {
    var that=this;
    if (CL.trace) CL.fnenterprint("chooseSubject: " + expr);
    var subject = null;
    var foundUnrestricted = false;
    var foundNewRestricted = false;
    var terms = expr.terms();
    var rv = terms.escapingEach(function(v, c) {
      if (foundUnrestricted) {
        if (!v.isRestricted) {
          if (!that.columnsHasKey(v)) {
            return {retval: v};
          }
        }
      } else {
        if (v.isRestricted) {
          if (!foundNewRestricted && !v.isDummy && c < 0.0) {
            var col = that._columns.get(v);
            if (col == null || (col.size() == 1 && that.columnsHasKey(that._objective))) {
              subject = v;
              foundNewRestricted = true;
            }
          }
        } else {
          subject = v;
          foundUnrestricted = true;
        }
      }
    });
    if (rv && rv.retval !== undefined) return rv.retval;

    if (subject != null) 
      return subject;

    var coeff = 0.0;

  // subject is nil. 
  // Make one last check -- if all of the variables in expr are dummy
  // variables, then we can pick a dummy variable as the subject
    var rv = terms.escapingEach(function(v,c) {
      if (!v.isDummy)  {
        return {retval:null};
      }
      if (!that.columnsHasKey(v)) {
        subject = v;
        coeff = c;
      }
    });
    if (rv && rv.retval !== undefined) return rv.retval;

    if (!CL.approx(expr.constant, 0.0)) {
      throw new c.RequiredFailure();
    }
    if (coeff > 0.0) {
      expr.multiplyMe(-1);
    }
    return subject;
  },

  deltaEditConstant: function(delta /*double*/, 
                              plusErrorVar /*c.AbstractVariable*/, 
                              minusErrorVar /*c.AbstractVariable*/) {
    var that = this;

    if (CL.trace) 
      CL.fnenterprint("deltaEditConstant :" + delta + ", " + plusErrorVar + ", " + minusErrorVar);

    var exprPlus = this.rowExpression(plusErrorVar);
    if (exprPlus != null) {
      exprPlus.constant += delta;
      if (exprPlus.constant < 0.0) {
        this._infeasibleRows.add(plusErrorVar);
      }
      return;
    }
    var exprMinus = this.rowExpression(minusErrorVar);
    if (exprMinus != null) {
      exprMinus.constant += -delta;
      if (exprMinus.constant < 0.0) {
        this._infeasibleRows.add(minusErrorVar);
      }
      return;
    }
    var columnVars = this._columns.get(minusErrorVar);
    if (!columnVars) {
      console.log("columnVars is null -- tableau is:\n" + this);
    }
    columnVars.each(function(basicVar) {
      var expr = that.rowExpression(basicVar);
      var c = expr.coefficientFor(minusErrorVar);
      expr.constant += (c * delta);
      if (basicVar.isRestricted && expr.constant < 0.0) {
        that._infeasibleRows.add(basicVar);
      }
    });
  },

  dualOptimize: function() {
    if (CL.trace) CL.fnenterprint("dualOptimize:");
    var zRow = this.rowExpression(this._objective);
    while (!this._infeasibleRows.isEmpty()) {
      var exitVar = this._infeasibleRows.values()[0];
      this._infeasibleRows.remove(exitVar);
      var entryVar = null;
      var expr = this.rowExpression(exitVar);
      if (expr != null) {
        if (expr.constant < 0.0) {
          var ratio = Number.MAX_VALUE;
          var r;
          var terms = expr.terms();
          terms.each(function(v, c) {
            if (c > 0.0 && v.isPivotable) {
              var zc = zRow.coefficientFor(v);
              r = zc / c;
              if (r < ratio || (CL.approx(r, ratio) && v.hashCode() < entryVar.hashCode())) {
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
    var that = this;
    if (CL.trace) {
      CL.fnenterprint("newExpression: " + cn);
      CL.traceprint("cn.isInequality == " + cn.isInequality);
      CL.traceprint("cn.isRequired() == " + cn.isRequired());
    }
    var cnExpr = cn.expression;
    var expr = new c.LinearExpression(cnExpr.constant);
    var slackVar = new c.SlackVariable();
    var dummyVar = new c.DummyVariable();
    var eminus = new c.SlackVariable();
    var eplus = new c.SlackVariable();
    var cnTerms = cnExpr.terms();
    // console.log(cnTerms.size());
    cnTerms.each(function(v, c) {
      var e = that.rowExpression(v);
      if (e == null) expr.addVariable(v, c);
      else expr.addExpression(e, c);
    });
    if (cn.isInequality) {
      if (CL.trace) CL.traceprint("Inequality, adding slack");
      ++this._slackCounter;
      slackVar = new c.SlackVariable(this._slackCounter, "s");
      expr.setVariable(slackVar, -1);
      this._markerVars.put(cn, slackVar);
      if (!cn.isRequired()) {
        ++this._slackCounter;
        eminus = new c.SlackVariable(this._slackCounter, "em");
        expr.setVariable(eminus, 1.0);
        var zRow = this.rowExpression(this._objective);
        var sw = cn.strength.symbolicWeight.times(cn.weight);
        zRow.setVariable(eminus, sw.toDouble());
        this.insertErrorVar(cn, eminus);
        this.noteAddedVariable(eminus, this._objective);
      }
    } else {
      if (cn.isRequired()) {
        if (CL.trace) CL.traceprint("Equality, required");
        ++this._dummyCounter;
        dummyVar = new c.DummyVariable(this._dummyCounter, "d");
        expr.setVariable(dummyVar, 1.0);
        this._markerVars.put(cn, dummyVar);
        if (CL.trace) CL.traceprint("Adding dummyVar == d" + this._dummyCounter);
      } else {
        if (CL.trace) CL.traceprint("Equality, not required");
        ++this._slackCounter;
        eplus = new c.SlackVariable(this._slackCounter, "ep");
        eminus = new c.SlackVariable(this._slackCounter, "em");
        expr.setVariable(eplus, -1.0);
        expr.setVariable(eminus, 1.0);
        this._markerVars.put(cn, eplus);
        var zRow = this.rowExpression(this._objective);
        if (CL.trace) console.log(zRow);
        var sw = cn.strength.symbolicWeight.times(cn.weight);
        var swCoeff = sw.toDouble();
        if (swCoeff == 0) {
          if (CL.trace) CL.traceprint("sw == " + sw);
          if (CL.trace) CL.traceprint("cn == " + cn);
          if (CL.trace) CL.traceprint("adding " + eplus + " and " + eminus + " with swCoeff == " + swCoeff);
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
    if (CL.trace) CL.fnexitprint("returning " + expr);
    return expr;
  },

  optimize: function(zVar /*c.ObjectiveVariable*/) {
    var that=this;
    if (CL.trace) CL.fnenterprint("optimize: " + zVar);
    if (CL.trace) CL.traceprint(this.toString());
    var zRow = this.rowExpression(zVar);
    CL.Assert(zRow != null, "zRow != null");
    var entryVar = null;
    var exitVar = null;
    while  (true) {
      var objectiveCoeff = 0;
      var terms = zRow.terms();
      terms.escapingEach(function(v, c) {
//        if (v.isPivotable && c < 0.0 && (entryVar == null || v.hashCode() < entryVar.hashCode())) {
        if (v.isPivotable && c < objectiveCoeff) {
          objectiveCoeff = c;
          entryVar = v;
          return {brk:true};
        }
      });
      if (objectiveCoeff >= -this._epsilon) 
        return;
      if (CL.trace) {
        CL.traceprint("entryVar == " + entryVar + ", objectiveCoeff == " + objectiveCoeff);
      }
      var minRatio = Number.MAX_VALUE;
      var columnVars = this._columns.get(entryVar);
      var r = 0.0;
      columnVars.each(function(v) {
        if (that.trace) that.traceprint("Checking " + v);
        if (v.isPivotable) {
          var expr = that.rowExpression(v);
          var coeff = expr.coefficientFor(entryVar);
          if (that.trace) that.traceprint("pivotable, coeff = " + coeff);
          if (coeff < 0.0) {
            r = -expr.constant / coeff;
            if (r < minRatio || (CL.approx(r, minRatio) && v.hashCode() < exitVar.hashCode())) {
              minRatio = r;
              exitVar = v;
            }
          }
        }
      });
      if (minRatio == Number.MAX_VALUE) {
        throw new c.InternalError("Objective function is unbounded in optimize");
      }
      this.pivot(entryVar, exitVar);
      if (CL.trace) CL.traceprint(this.toString());
    }
  },

  pivot: function(entryVar /*c.AbstractVariable*/, exitVar /*c.AbstractVariable*/) {
    if (CL.trace) CL.fnenterprint("pivot: " + entryVar + ", " + exitVar);
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

  resetStayConstants: function() {
    if (CL.trace) CL.fnenterprint("resetStayConstants");
    for (var i = 0; i < this._stayPlusErrorVars.length; i++)
    {
      var expr = this.rowExpression(/* c.AbstractVariable */this._stayPlusErrorVars[i]);
      if (expr == null)
        expr = this.rowExpression(/* c.AbstractVariable */this._stayMinusErrorVars[i]);
      if (expr != null)
        expr.constant = 0.0;
    }
  },

  setExternalVariables: function() {
    var that=this;
    if (CL.trace) CL.fnenterprint("setExternalVariables:");
    if (CL.trace) CL.traceprint(this.toString());
    this._externalParametricVars.each(function(v) {
      if (that.rowExpression(v) != null) {
        console.log("Error: variable" + v + " in _externalParametricVars is basic");
      } else {
        v.change_value(0.0);
      }
    });
    this._externalRows.each(function(v) {
      var expr = that.rowExpression(v);
      if (CL.trace) CL.debugprint("v == " + v);
      if (CL.trace) CL.debugprint("expr == " + expr);
      v.change_value(expr.constant);
    });
    this._fNeedsSolving = false;
  },

  insertErrorVar: function(cn /*c.Constraint*/, aVar /*c.AbstractVariable*/) {
    if (CL.trace) CL.fnenterprint("insertErrorVar:" + cn + ", " + aVar);
    var cnset = /* Set */this._errorVars.get(aVar);
    if (cnset == null) 
      this._errorVars.put(cn, cnset = new HashSet());
    cnset.add(aVar);
  },
});
})(CL);
