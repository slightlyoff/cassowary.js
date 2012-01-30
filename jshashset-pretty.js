/**
 * Copyright 2010 Tim Down.
 * UPDATED TO SUPPORT .each(function) method by Greg Badros <badros@gmail.com>
 * UPDATED TO REMOVE WHAT CASSOWARY DOESN"T NEED by Alex Russell <slightlyoff@google.com>
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
HashSet = c.inherit({
  initialize: function() {
    this._ht = new SimpleHashtable();
  },

  add: function(d) {
    this._ht.put(d, true);
  },

  values: function() {
    return this._ht.keys();
  },

  remove: function(d) {
    return this._ht.remove(d) ? d : null
  },

  clear: function() {
    this._ht.clear();
  },

  size: function() {
    return this._ht.size();
  },

  each: function(f) {
    var e = this._ht.keys();
    var i = e.length;
    while (i--) {
      f(e[i]);
    }
  }
});
