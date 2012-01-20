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
    return item + "";
  }

	// A minimal console
	var log = function(hint, args){
    var r = "";
    var al = args.length;
		r += ((hint ? hint + ":" : "") + toString(args[0]));
		for(var i = 1; i < al; i++){
			r += (" " + toString(args[i]));
		}
    print(r);
	};

  // Intentionally define console in the global namespace
  console = {
    log:    function() { log(0, Array.prototype.slice.call(arguments, 0)); },
    error:  function() { log("ERROR", Array.prototype.slice.call(arguments, 0)); },
    warn:   function() { log("WARN", Array.prototype.slice.call(arguments, 0)); }
  };

})()

// load('jshashtable-2.1-gjb.js');
load('jshashtable_src.js');
// load('jshashset-gjb.js');
load('jshashset-pretty.js');

load('CL.js')

// Command-line argument processing
if (this.arguments) {
  this.arguments.forEach(function(a, idx) {
    if (a.indexOf("=") != -1) {
      var arr = a.split("=", 2);
      if (typeof c[arr[0]] != "undefined") {
        c[arr[0]] = JSON.parse(arr[1]);
      }
    }
  });
}

load('simple-hashtable.js');
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
