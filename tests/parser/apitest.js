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
			console.log("!!!starting api test!!!")
			c._reset();
			var changes = [];
			var callback = function (change) {
				changes.push(change);
			};
			c(callback);

			c('a+b==c');
			c('a==1');
			c('b==0');

			// FIXME: will be in one array and delivered outside this call stack.
			// Test should return a promise resolved with these assertions inside callback.

			assert.equal(3, changes[0].length);
			assert.deepEqual(["new a", "new b", "new c"], changes[0].map(function(record){ return record.type + " " + record.name; }).sort());

			assert.deepEqual(["updated a", "updated b"], changes[1].map(function(record){ return record.type + " " + record.name }).sort());

			assert.deepEqual(["updated b", "updated c"], changes[2].map(function(record){ return record.type + " " + record.name }).sort());
		});
	});
});