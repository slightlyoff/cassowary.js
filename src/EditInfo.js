// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

(function(c) {
"use strict";

c.EditInfo = c.inherit({
  /* FIELDS:
      var cn //c.Constraint
      var clvEditPlus //c.SlackVariable
      var clvEditMinus //c.SlackVariable
      var prevEditConstant //double
      var i //int
  */
  initialize: function(cn_ /*c.Constraint*/, 
                       eplus_ /*c.SlackVariable*/,
                       eminus_ /*c.SlackVariable*/,
                       prevEditConstant_ /*double*/,
                       i_ /*int*/) {
    this.constraint = cn_;
    this.clvEditPlus = eplus_;
    this.clvEditMinus = eminus_;
    this.prevEditConstant = prevEditConstant_;
    this.index = i_;
  },
  toString: function() {
    return "<cn=" + this.constraint +
           ", ep=" + this.clvEditPlus +
           ", em=" +this.clvEditMinus +
           ", pec=" + this.prevEditConstant +
           ", index=" + this.index + ">";
  }
});

})(c);
