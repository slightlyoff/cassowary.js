/**
 * Copyright 2011, Alex Russell <slightlyoff@google.com>
 * API compatible re-implementation of jshashset.js, but to only use what
 * Cassowary needs, and constructed for speed.
 */
(function(scope) {
"use strict";

scope.HashSet = c.inherit({
  initialize: function() {
    this.storage = [];
  },

  add: function(item) {
    var s = this.storage;
    var io = s.indexOf(item);
    if (s.indexOf(item) == -1) {
      s.push(item);
    }
    return this;
  },

  values: function() {
    // FIXME(slightlyoff): is it safe to assume we won't be mutated by our caller?
    //                     if not, return this.storage.slice(0);
    return this.storage;
  },

  remove: function(item) {
    var s = this.storage;
    var io = s.indexOf(item);
    if (io == -1) { return null; }
    return s.splice(io, 1)[0];
  },

  clear: function() { this.storage.length = 0; },

  size: function() { return this.storage.length; },

  each: function(func) { this.storage.forEach(func); }
});

})(this);
