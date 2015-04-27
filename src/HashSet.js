/**
 * Copyright 2011, Alex Russell <slightlyoff@google.com>
 *
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 *
 * API compatible re-implementation of jshashset.js, including only what
 * Cassowary needs. Built for speed, not comfort.
 */
(function(c) {
"use strict";

// FIXME(slightlyoff): now that Set is in v8 and has iteration, migratpue

if (c._functionalMap) {

  c.HashSet = c.inherit({
    _t: "c.HashSet",

    initialize: function(hs) {
      this.hashCode = c._inc();
      if (hs instanceof c.HashSet) {
        this._store = new Map(hs._store);
      } else {
        this._store = new Map();
      }
    },

    add: function(item) {
      // if (!key.hashCode) debugger;
      return this._store.set(item.hashCode, item);
    },

    has: function(item) {
      return this._store.has(item.hashCode);
    },

    get size() {
      return this._store.size;
    },

    clear: function() {
      this._store.clear();
    },

    values: function() {
      var values = [];
      var vi = this._store.values();
      var rec = vi.next();
      while (!rec.done) {
        values.push(rec.value);
        rec = vi.next();
      }
      return values;
    },

    first: function() {
      var vi = this._store.values();
      var rec = vi.next();
      if (rec.done) { return null; }
      return rec.value;
    },

    delete: function(item) {
      this._store.delete(item.hashCode);
    },

    each: function(callback, scope) {
      var that = this;
      this._store.forEach(function(item, key) {
        return callback.call(scope||null, item, item, that);
      }, scope);
    },

    escapingEach: function(func, scope) {
      // FIXME(slightlyoff): actually escape!
      if (this.size)
        this._store.forEach(func, scope);
    },

    toString: function() {
      var answer = this.size + " {";
      var first = true;
      this.each(function(e) {
        if (!first) {
          answer += ", ";
        } else {
          first = false;
        }
        answer += e;
      });
      answer += "}\n";
      return answer;
    },

    toJSON: function() {
      var d = [];
      this.each(function(e) {
        d[d.length] = e.toJSON();
      });
      return {
        _t: "c.HashSet",
        data: d
      };
    },

    fromJSON: function(o) {
      var r = new c.HashSet();
      if (o.data) {
        r.size = o.data.length;
        r._store = o.data;
      }
      return r;
    },
  });

} else {

  c.HashSet = c.inherit({
    _t: "c.HashSet",

    initialize: function() {
      this._store = [];
      this.size = 0;
      this.hashCode = c._inc();
    },

    add: function(item) {
      var s = this._store, io = s.indexOf(item);
      if (s.indexOf(item) == -1) { s[s.length] = item; }
      this.size = s.length;
    },

    values: function() {
      // FIXME(slightlyoff): is it safe to assume we won't be mutated by our caller?
      //                     if not, return this._store.slice(0);
      return this._store;
    },

    first: function() {
      return this._store[0];
    },

    has: function(item) {
      return (this._store.indexOf(item) != -1);
    },

    delete: function(item) {
      var io = this._store.indexOf(item);
      if (io == -1) { return null; }
      this._store.splice(io, 1)[0];
      this.size = this._store.length;
    },

    clear: function() {
      this._store.length = 0;
    },

    each: function(func, scope) {
      if(this.size)
        this._store.forEach(func, scope);
    },

    escapingEach: function(func, scope) {
      // FIXME(slightlyoff): actually escape!
      if (this.size)
        this._store.forEach(func, scope);
    },

    toString: function() {
      var answer = this.size + " {";
      var first = true;
      this.each(function(e) {
        if (!first) {
          answer += ", ";
        } else {
          first = false;
        }
        answer += e;
      });
      answer += "}\n";
      return answer;
    },

    toJSON: function() {
      var d = [];
      this.each(function(e) {
        d[d.length] = e.toJSON();
      });
      return {
        _t: "c.HashSet",
        data: d
      };
    },

    fromJSON: function(o) {
      var r = new c.HashSet();
      if (o.data) {
        r.size = o.data.length;
        r._store = o.data;
      }
      return r;
    },
  });
}

})(this["c"]||module.parent.exports||{});
