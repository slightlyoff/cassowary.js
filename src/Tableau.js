// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Russell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.Tableau = c.inherit({
  initialize: function() {
    /* FIELDS:
        var columns // c.HashTable of vars -> set of vars
        var rows // c.HashTable of vars -> expr
        var _infeasibleRows //Set of vars
        var _externalRows //Set of vars
        var _externalParametricVars //Set of vars
   */

    this.columns = new c.HashTable(); // values are sets
    this.rows = new c.HashTable();    // values are c.Expressions

    this._infeasibleRows = new c.HashSet();
    this._externalRows = new c.HashSet();
    this._externalParametricVars = new c.HashSet();
  },

  noteRemovedVariable: function(v /*ClAbstractVariable*/, subject /*ClAbstractVariable*/) {
    if (c.verbose) c.fnenterprint("noteRemovedVariable: " + v + ", " + subject);
    if (subject != null) {
      this.columns.get(v).delete(subject);
    }
  },

  noteAddedVariable: function(v /*ClAbstractVariable*/, subject /*ClAbstractVariable*/) {
    if (c.verbose) c.fnenterprint("noteAddedVariable: " + v + ", " + subject);
    if (subject) {
      this.insertColVar(v, subject);
    }
  },

  getInternalInfo: function() {
    var retstr = "Tableau Information:\n";
    retstr += "Rows: " + this.rows.size;
    retstr += " (= " + (this.rows.size - 1) + " constraints)";
    retstr += "\nColumns: " + this.columns.size;
    retstr += "\nInfeasible Rows: " + this._infeasibleRows.size;
    retstr += "\nExternal basic variables: " + this._externalRows.size;
    retstr += "\nExternal parametric variables: ";
    retstr += this._externalParametricVars.size;
    retstr += "\n";
    return retstr;
  },

  toString: function() {
    var bstr = "Tableau:\n";
    this.rows.each(function(clv, expr) {
      bstr += clv;
      bstr += " <==> ";
      bstr += expr;
      bstr += "\n";
    });
    bstr += "\nColumns:\n";
    bstr += c.hashToString(this.columns);
    bstr += "\nInfeasible rows: ";
    bstr += c.setToString(this._infeasibleRows);
    bstr += "External basic variables: ";
    bstr += c.setToString(this._externalRows);
    bstr += "External parametric variables: ";
    bstr += c.setToString(this._externalParametricVars);
    return bstr;
  },

  // Convenience function to insert a variable into
  // the set of rows stored at columns[param_var],
  // creating a new set if needed
  insertColVar: function(param_var /*Variable*/, rowvar /*Variable*/) {
    var rowset = /* Set */ this.columns.get(param_var);
    if (!rowset) {
      rowset = new c.HashSet();
      this.columns.set(param_var, rowset);
    }
    rowset.add(rowvar);

    /*
    print("rowvar =" + rowvar);
    print("rowset = " + c.setToString(rowset));
    print("this.columns = " + c.hashToString(this.columns));
    */
  },

  addRow: function(aVar /*ClAbstractVariable*/, expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("addRow: " + aVar + ", " + expr);
    // print("addRow: " + aVar + " (key), " + expr + " (value)");
    // print(this.rows.size);
    this.rows.set(aVar, expr);
    expr.terms.each(function(clv, coeff) {
      // print("insertColVar(" + clv + ", " + aVar + ")");
      this.insertColVar(clv, aVar);
      if (clv.isExternal) {
        this._externalParametricVars.add(clv);
        // print("External parametric variables added to: " + 
        //       c.setToString(this._externalParametricVars));
      }
    }, this);
    if (aVar.isExternal) {
      this._externalRows.add(aVar);
    }
    if (c.trace) c.traceprint(this.toString());
  },

  removeColumn: function(aVar /*ClAbstractVariable*/) {
    if (c.trace) c.fnenterprint("removeColumn:" + aVar);
    var rows = /* Set */ this.columns.get(aVar);
    if (rows) {
      this.columns.delete(aVar);
      rows.each(function(clv) {
        var expr = /* c.Expression */this.rows.get(clv);
        expr.terms.delete(aVar);
      }, this);
    } else {
      if (c.trace) c.debugprint("Could not find var " + aVar + " in columns");
    }
    if (aVar.isExternal) {
      this._externalRows.delete(aVar);
      this._externalParametricVars.delete(aVar);
    }
  },

  removeRow: function(aVar /*ClAbstractVariable*/) {
    if (c.trace) c.fnenterprint("removeRow:" + aVar);
    var expr = /* c.Expression */this.rows.get(aVar);
    c.Assert(expr != null);
    expr.terms.each(function(clv, coeff) {
      var varset = this.columns.get(clv);
      if (varset != null) {
        if (c.trace) c.debugprint("removing from varset " + aVar);
        varset.delete(aVar);
      }
    }, this);
    this._infeasibleRows.delete(aVar);
    if (aVar.isExternal) {
      this._externalRows.delete(aVar);
    }
    this.rows.delete(aVar);
    if (c.trace) c.fnexitprint("returning " + expr);
    return expr;
  },

  substituteOut: function(oldVar /*ClAbstractVariable*/, expr /*c.Expression*/) {
    if (c.trace) c.fnenterprint("substituteOut:" + oldVar + ", " + expr);
    if (c.trace) c.traceprint(this.toString());

    var varset = this.columns.get(oldVar);
    varset.each(function(v) {
      var row = this.rows.get(v);
      row.substituteOut(oldVar, expr, v, this);
      if (v.isRestricted && row.constant < 0) {
        this._infeasibleRows.add(v);
      }
    }, this);

    if (oldVar.isExternal) {
      this._externalRows.add(oldVar);
      this._externalParametricVars.delete(oldVar);
    }

    this.columns.delete(oldVar);
  },

  columnsHasKey: function(subject /*ClAbstractVariable*/) {
    return (this.columns.get(subject) != null);
  },
});

})(c);
