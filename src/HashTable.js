/**
 * Copyright 2012 Alex Russell <slightlyoff@google.com>.
 *
 * Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
 *
 * This is an API compatible re-implementation of the subset of jshashtable
 * which Cassowary actually uses.
 *
 * Features removed:
 *
 *     - multiple values per key
 *     - error tollerent hashing of any variety
 *     - overly careful (or lazy) size counting, etc.
 *     - Crockford's "class" pattern. We use the system from c.js.
 *     - any attempt at back-compat with broken runtimes.
 *
 * APIs removed, mostly for lack of use in Cassowary:
 *
 *     - support for custom hashing and equality functions as keys to ctor
 *     - isEmpty() -> check for !ht.size()
 *     - putAll()
 *     - entries()
 *     - containsKey()
 *     - containsValue()
 *     - keys()
 *     - values()
 *
 * Additions:
 *
 *     - new "scope" parameter to each() and escapingEach()
 */

(function(c) {
"use strict";

if (typeof Map != "undefined" &&
    typeof Map.prototype.forEach != "undefined") {

  c.HashTable = c.inherit({

    initialize: function(ht) {
      this.hashCode = c._inc();
      this._store = new Map();
      if (ht instanceof c.HashTable) {
        if (Map.length) {
          this._store = new Map(ht._store);
        } else { // Hacking around Safari 8's limitations
          var that = this._store;
          ht._store.forEach(function(v, k) {
            that.set(k, v);
          });
        }
      }
    },

    clone: function() {
      return new c.HashTable(this);
    },

    get: function(key) {
      var r = this._store.get(key.hashCode);
      if (r === undefined) {
        return null;
      }
      return r[1];
    },

    clear: function() {
      this._store.clear();
    },

    get size() {
      return this._store.size;
    },

    set: function(key, value) {
      // if (!key.hashCode) debugger;
      return this._store.set(key.hashCode, [key, value]);
    },

    delete: function(key) {
      return this._store.delete(key.hashCode);
    },

    each: function(callback, scope) {
      this._store.forEach(function(v, k) {
        return callback.call(scope||null, v[0], v[1]);
      }, scope);
    },

    escapingEach: function(callback, scope) {
      if (!this._store.size) { return; }

      var context;
      var keys = [];
      var rec;
      for(var y of this._store.keys()) {
        keys.push(y)
      };

      for(var k in keys) {
        rec = this._store.get(keys[k]);
        context = callback.call(scope||null, rec[0], rec[1]);

        if (context) {
          if (context.retval !== undefined) {
            return context;
          }
          if (context.brk) {
            break;
          }
        }
      }
    },

    equals: function(other) {
      if (other === this) {
        return true;
      }

      if (!(other instanceof c.HashTable) || other._size !== this._size) {
        return false;
      }

      for(var x in this._store.keys()) {
        if (other._store.get(x) == undefined) {
          return false;
        }
      }
      return true;
    },

  });

} else {
  // For escapingEach
  var defaultContext = {};
  var copyOwn = function(src, dest) {
    Object.keys(src).forEach(function(x) {
      dest[x] = src[x];
    });
  };


  c.HashTable = c.inherit({

    initialize: function() {
      this.size = 0;
      this._store = {};
      this._keyStrMap = {};
      this._deleted = 0;
    },

    set: function(key, value) {
      var hash = key.hashCode;

      if (typeof this._store[hash] == "undefined") {
        // FIXME(slightlyoff): if size gooes above the V8 property limit,
        // compact or go to a tree.
        this.size++;
      }
      this._store[hash] = value;
      this._keyStrMap[hash] = key;
    },

    get: function(key) {
      if(!this.size) { return null; }

      key = key.hashCode;

      var v = this._store[key];
      if (typeof v != "undefined") {
        return this._store[key];
      }
      return null;
    },

    clear: function() {
      this.size = 0;
      this._store = {};
      this._keyStrMap = {};
    },

    _compact: function() {
      // console.time("HashTable::_compact()");
      var ns = {};
      copyOwn(this._store, ns);
      this._store = ns;
      // console.timeEnd("HashTable::_compact()");
    },

    _compactThreshold: 100,
    _perhapsCompact: function() {
      // If we have more properties than V8's fast property lookup limit, don't
      // bother
      if (this._size > 30) return;
      if (this._deleted > this._compactThreshold) {
        this._compact();
        this._deleted = 0;
      }
    },

    delete: function(key) {
      key = key.hashCode;
      if (!this._store.hasOwnProperty(key)) {
        return;
      }
      this._deleted++;

      // FIXME(slightlyoff):
      //    I hate this because it causes these objects to go megamorphic = (
      //    Sadly, Cassowary is hugely sensitive to iteration order changes, and
      //    "delete" preserves order when Object.keys() is called later.
      delete this._store[key];
      // Note: we don't delete from _keyStrMap because we only get the
      // Object.keys() from _store, so it's the only one we need to keep up-to-
      // date.

      if (this.size > 0) {
        this.size--;
      }
    },

    each: function(callback, scope) {
      if (!this.size) { return; }

      this._perhapsCompact();

      var store = this._store;
      var keyMap = this._keyStrMap;
      for (var x in this._store) {
        if (this._store.hasOwnProperty(x)) {
          callback.call(scope||null, keyMap[x], store[x]);
        }
      }
    },

    escapingEach: function(callback, scope) {
      if (!this.size) { return; }

      this._perhapsCompact();

      var that = this;
      var store = this._store;
      var keyMap = this._keyStrMap;
      var context = defaultContext;
      var kl = Object.keys(store);
      for (var x = 0; x < kl.length; x++) {
        (function(v) {
          if (that._store.hasOwnProperty(v)) {
            context = callback.call(scope||null, keyMap[v], store[v]);
          }
        })(kl[x]);

        if (context) {
          if (context.retval !== undefined) {
            return context;
          }
          if (context.brk) {
            break;
          }
        }
      }
    },

    clone: function() {
      var n = new c.HashTable();
      if (this.size) {
        n.size = this.size;
        copyOwn(this._store, n._store);
        copyOwn(this._keyStrMap, n._keyStrMap);
      }
      return n;
    },

    equals: function(other) {
      if (other === this) {
        return true;
      }

      if (!(other instanceof c.HashTable) || other._size !== this._size) {
        return false;
      }

      var codes = Object.keys(this._store);
      for (var i = 0; i < codes.length; i++) {
        var code = codes[i];
        if (this._keyStrMap[code] !== other._keyStrMap[code] ||
            this._store[code] !== other._store[code]) {
          return false;
        }
      }

      return true;
    },

    toString: function(h) {
      var answer = "";
      this.each(function(k, v) { answer += k + " => " + v + "\n"; });
      return answer;
    },

    toJSON: function() {
      var d = {};
      this.each(function(key, value) {
        d[key.toString()] = (value.toJSON) ? value.toJSON : value.toString();
      });
      return {
        _t: "c.HashTable",
        store: d
      };
    },

    fromJSON: function(o) {
      var r = new c.HashTable();
      /*
      if (o.data) {
        r.size = o.data.length;
        r.storage = o.data;
      }
      */
      return r;
    },
  });
}

})(this["c"]||module.parent.exports||{});
