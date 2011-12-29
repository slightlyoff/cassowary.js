(function(Cl) {

Cl.Tableau = Cl.inherit(
  function() {
    /* FIELDS:
        var _columns //Hashtable of vars -> set of vars
        var _rows //Hashtable of vars -> expr
        var _infeasibleRows //Set of vars
        var _externalRows //Set of vars
        var _externalParametricVars //Set of vars
   */
    this._columns = new Hashtable(); // values are sets
    this._rows = new Hashtable(); // values are ClLinearExpressions
    this._infeasibleRows = new HashSet();
    this._externalRows = new HashSet();
    this._externalParametricVars = new HashSet();
  },
  null,
  {
    noteRemovedVariable: function(v /*ClAbstractVariable*/, subject /*ClAbstractVariable*/) {
      if (CL.fVerboseTraceOn) CL.fnenterprint("noteRemovedVariable: " + v + ", " + subject);
      if (subject != null) {
        this._columns.get(v).remove(subject);
      }
    },

    noteAddedVariable: function(v /*ClAbstractVariable*/, subject /*ClAbstractVariable*/) {
      if (CL.fVerboseTraceOn) CL.fnenterprint("noteAddedVariable: " + v + ", " + subject);
      if (subject) {
        this.insertColVar(v, subject);
      }
    },

    getInternalInfo: function() {
      var retstr = "Tableau Information:\n";
      retstr += "Rows: " + this._rows.size();
      retstr += " (= " + (this._rows.size() - 1) + " constraints)";
      retstr += "\nColumns: " + this._columns.size();
      retstr += "\nInfeasible Rows: " + this._infeasibleRows.size();
      retstr += "\nExternal basic variables: " + this._externalRows.size();
      retstr += "\nExternal parametric variables: ";
      retstr += this._externalParametricVars.size();
      retstr += "\n";
      return retstr;
    },

    toString: function() {
      var bstr = "Tableau:\n";
      this._rows.each(function(clv, expr) {
        bstr += clv;
        bstr += " <==> ";
        bstr += expr;
        bstr += "\n";
      });
      bstr += "\nColumns:\n";
      bstr += CL.hashToString(this._columns);
      bstr += "\nInfeasible rows: ";
      bstr += CL.setToString(this._infeasibleRows);
      bstr += "External basic variables: ";
      bstr += CL.setToString(this._externalRows);
      bstr += "External parametric variables: ";
      bstr += CL.setToString(this._externalParametricVars);
      return bstr;
    },

    // Convenience function to insert a variable into
    // the set of rows stored at _columns[param_var],
    // creating a new set if needed
    insertColVar: function(param_var /*ClAbstractVariable*/, rowvar /*ClAbstractVariable*/) {
      var rowset = /* Set */this._columns.get(param_var);
      if (!rowset) 
        this._columns.put(param_var, rowset = new HashSet());
      rowset.add(rowvar);
      /*
      print("rowvar =" + rowvar);
      print("rowset = " + CL.setToString(rowset));
      print("this._columns = " + CL.hashToString(this._columns));
      */
    },

    addRow: function(aVar /*ClAbstractVariable*/, expr /*ClLinearExpression*/) {
      var that=this;
      if (CL.fTraceOn) CL.fnenterprint("addRow: " + aVar + ", " + expr);
      this._rows.put(aVar, expr);
      expr.terms().each(function(clv, coeff) {
        // print("insertColVar(" + clv + ", " + aVar + ")");
        that.insertColVar(clv, aVar);
        if (clv.isExternal) {
          that._externalParametricVars.add(clv);
          // print("External parametric variables added to: " + 
          //       CL.setToString(that._externalParametricVars));
        }
      });
      if (aVar.isExternal) {
        this._externalRows.add(aVar);
      }
      if (CL.fTraceOn) CL.traceprint(this.toString());
    },

    removeColumn: function(aVar /*ClAbstractVariable*/) {
      var that=this;
      if (CL.fTraceOn) CL.fnenterprint("removeColumn:" + aVar);
      var rows = /* Set */ this._columns.remove(aVar);
      if (rows) {
        rows.each(function(clv) {
          var expr = /* ClLinearExpression */that._rows.get(clv);
          expr.terms().remove(aVar);
        });
      } else {
        if (CL.fTraceOn) CL.debugprint("Could not find var " + aVar + " in _columns");
      }
      if (aVar.isExternal) {
        this._externalRows.remove(aVar);
        this._externalParametricVars.remove(aVar);
      }
    },

    removeRow: function(aVar /*ClAbstractVariable*/) {
      var that=this;
      if (CL.fTraceOn) CL.fnenterprint("removeRow:" + aVar);
      var expr = /* ClLinearExpression */this._rows.get(aVar);
      CL.Assert(expr != null);
      expr.terms().each(function(clv, coeff) {
        var varset = that._columns.get(clv);
        if (varset != null) {
          if (CL.fTraceOn) CL.debugprint("removing from varset " + aVar);
          varset.remove(aVar);
        }
      });
      this._infeasibleRows.remove(aVar);
      if (aVar.isExternal) {
        this._externalRows.remove(aVar);
      }
      this._rows.remove(aVar);
      if (CL.fTraceOn) CL.fnexitprint("returning " + expr);
      return expr;
    },

    substituteOut: function(oldVar /*ClAbstractVariable*/, expr /*ClLinearExpression*/) {
      var that=this;
      if (CL.fTraceOn) CL.fnenterprint("substituteOut:" + oldVar + ", " + expr);
      if (CL.fTraceOn) CL.traceprint(this.toString());
      var varset = /* Set */this._columns.get(oldVar);
      varset.each(function(v) {
        var row = /* ClLinearExpression */that._rows.get(v);
        row.substituteOut(oldVar, expr, v, that);
        if (v.isRestricted && row.constant < 0.0) {
          that._infeasibleRows.add(v);
        }
      });
      if (oldVar.isExternal) {
        this._externalRows.add(oldVar);
        this._externalParametricVars.remove(oldVar);
      }
      this._columns.remove(oldVar);
    },

    columns: function() {
      return this._columns;
    },

    rows: function() {
      return this._rows;
    },

    columnsHasKey: function(subject /*ClAbstractVariable*/) {
      return (this._columns.get(subject) != null);
    },

    rowExpression: function(v /*ClAbstractVariable*/) {
      return /* ClLinearExpression */this._rows.get(v);
    },
  }
);

})(CL);
