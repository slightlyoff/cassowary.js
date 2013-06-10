/* global c */

// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by http://www.apache.org/licenses/LICENSE-2.0
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

define([
	'intern!bdd',
	'intern/chai!assert',
	'dojo/has!host-node?./deps'
], function (bdd, assert) {
	'use strict';

	var describe = bdd.describe,
		it = bdd.it;

	describe('c.SimplexSolver', function () {
		it('should be constructable without args', function () {
			new c.SimplexSolver();
		});

		// FIXME(slightlyoff): MOAR TESTS
		describe('addPointStays', function () {

		});
	});
});