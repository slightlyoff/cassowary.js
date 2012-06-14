/**
 * Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
 * Use of this source code is governed by the LGPL, which can be found in the
 * COPYING.LGPL file.
 */

(function(scope) {
"use strict";

// FIXME(slightlyoff):
//      Should I just be adding stuff to the root protos? I'm not seeing much
//      reason not to, particularly since these pollute the global and I don't
//      want to bother with AMD.
scope.toArray = function(a) {
  if (Array.isArray(a))
    return a;

  if (arguments.length == 1 && typeof a.length != "undefined") {
    var r = new Array(a.length);
    for (var x = 0; x < a.length; x++) {
      r[x] = a[x];
    }
    return r;
  }

  return Array.prototype.slice.call(arguments);
};

scope.toCamelCase = function(str) {
  // TODO(slightlyoff): memoize!
  var first = true;
  return str.split(/[-_]/).map(function(v, i) {
    if (!v) { return; }
    if (v && !first) {
      return v.substr(0, 1).toUpperCase() + v.substr(1);
    }
    first = false;
    return v;
  }).join("");
};

var callOrOnload = function(obj, cb) {
  if(obj.document.readyState == "complete") {
    cb();
  } else {
    obj.addEventListener("load", cb);
  }
};

scope.ready = function(cb, d) {
  cb = cb || function(){};
  if (d) { // id of an iframe
    if (typeof d == "string") {
      var f = scope.frames[d]||document.getElementById(d).contentWindow;
      callOrOnload(f, cb);
    } else {
      callOrOnload(d, cb);
    }
    return;
  }
  callOrOnload(window, cb);
};

})(this);

