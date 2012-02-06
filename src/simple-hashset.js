/**
 * Copyright 2011, Alex Russell <slightlyoff@google.com>
 *
 * Use of this source code is governed by the LGPL, which can be found in the
 * COPYING.LGPL file.
 *
 * API compatible re-implementation of jshashset.js, including only what
 * Cassowary needs. Built for speed, not comfort.
 */
(function(scope, c) {
"use strict";

c.HashSet = scope.HashSet = c.inherit({

  initialize: function() {
    this.storage = [];
  },

  add: function(item) {
    var s = this.storage, io = s.indexOf(item);
    if (s.indexOf(item) == -1) { s.push(item); }
  },

  values: function() {
    // FIXME(slightlyoff): is it safe to assume we won't be mutated by our caller?
    //                     if not, return this.storage.slice(0);
    return this.storage;
  },

  remove: function(item) {
    var io = this.storage.indexOf(item);
    if (io == -1) { return null; }
    return this.storage.splice(io, 1)[0];
  },

  clear: function() {
    this.storage.length = 0;
  },

  size: function() {
    return this.storage.length;
  },

  each: function(func) {
    this.storage.forEach(func);
  }
});

})(this, c);
