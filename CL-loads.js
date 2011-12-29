// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

(function() {

  var toString = function(item) {
    var t = (typeof item);
    if (t == "undefined") {
      return "undefined";
    } else if (t == "string") {
      return item;
    } else if (t == "number") {
      return item + "";
    } else if (item instanceof Array) {
      return item + "";
    }
  }

	// A minimal console
	var log = function(hint, args){
    var r = "";
		r += ((hint ? hint + ":" : "") + toString(args[0]));
		for(var i = 1; i < args.length; i++){
			r += (", " + toString(args[i]));
		}
    print(r);
	};

  // Intentionally define console in the global namespace
  console = {
    log:    function() { log(0, arguments); },
    error:  function() { log("ERROR", arguments); },
    warn:   function() { log("WARN", arguments); }
  };

})()

load('jshashtable-2.1-gjb.js');
load('jshashset-gjb.js');
load('CL.js')
load('ExCLError.js')
load('ClSymbolicWeight.js')
load('ClStrength.js')
load('ClVariable.js')
load('ClPoint.js')
load('ClLinearExpression.js')
load('ClConstraint.js')
load('ClLinearConstraint.js')
load('ClEditInfo.js')
load('ClTableau.js')
load('ClSimplexSolver.js')

load('Timer.js')
load('ClTests.js')
