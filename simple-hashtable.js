/**
 * Copyright 2010 Tim Down.
 * Parts Copyright 2011 Alex Russell <slightlyoff@google.com>.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * jshashtable
 *
 * jshashtable is a JavaScript implementation of a hash table. It creates a
 * single constructor function called Hashtable in the global scope.
 *
 * Author: Tim Down <tim@timdown.co.uk>
 * Version: 2.1
 * Build date: 21 March 2010
 * Website: http://www.timdown.co.uk/jshashtable
 *
 *
 *
 * Alex's notes on the simplified version:
 *
 *  This is a (mostly) API compatible version of jshashtable, but hopefully
 *  with all of the slow and busted removed. It's a first step to using a saner
 *  system in cassowary alltogether. But baby steps. Baby steps.
 *
 *  Things the simple version does *NOT* do:
 *
 *      - multiple values per key
 *      - error tollerent hashing of any variety
 *      - overly careful (or lazy) size counting, etc.
 *      - Crockford's broken-ass "class" pattern. We use the "class" system
 *        assumed in CL.js.
 *      - any attempt at back-compat with broken runtimes. Tough shit.
 *
 *  Explicit removals, mostly for lack of use in Cassowary:
 *      
 *      - support for custom hashing and equality functions as keys to ctor
 *      - isEmpty() -> check for !ht.size()
 *      - putAll()
 *      - clone()
 *      - entries()
 *      - containsKey()
 *      - containsValue()
 *
 *  "keys()" is also un-used but retained for symmetry with "values()"
 */

(function(c) {

/* Global */
SimpleHashtable = c.inherit({
  initialize: function() {
    this._size = 0;
    this._store = {};
  },

  put: function(key, value) { return oldValue, },
  get: function(key) { }, 
  clear: function() { }, 
  keys: createBucketAggregator("keys"),
  values: createBucketAggregator("values"),
  remove: function(key) {
    if (this._size > 0) {
      this._size--;
    }
  },
  size: function() { },
  each: function(callback) { },
  escapingEach: function(callback) { },

})(CL);
