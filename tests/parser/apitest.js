/* global c */

// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
//
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0

define([
	'intern!bdd',
	'intern/chai!assert',
	'../deps'
], function (bdd, assert) {
	'use strict';

	var describe = bdd.describe,
		it = bdd.it;

	describe('new api', function () {
		it('informs on variable changes', function () {
			var changes = [];
			c('a+b==c');
      var a = c('a')[0];
      var b = c('b')[0];

			c(function (change) {
				changes.push(change);
			});

			c('a=='+(a.value+1)); // forces and and b or c to change
			assert.equal(1, changes.length);
      assert.equal(2, Object.keys(changes[0]).length);
			assert.property(changes[0], 'a');

			c('b=='+(b.value+2)); // forces b and c to change
      assert.equal(2, changes.length, "has length");
			assert.property(changes[1], 'b');
			assert.property(changes[1], 'c');
		});
	});
});
