/* global c */

// Copyright (C) 2013, Alex Russell <slightlyoff@chromium.org>
// Use of this source code is governed by
//    http://www.apache.org/licenses/LICENSE-2.0

define([
	'intern!bdd',
	'intern/chai!assert',
	'dojo/has!host-node?../deps'
], function (bdd, assert) {
	'use strict';

	var describe = bdd.describe,
		it = bdd.it;

	describe('parser smoketests', function () {
		it('should have a meaningful c._api', function () {
			assert.isTrue(typeof c._api === 'function');
		});

		it('can parse an empty string', function () {
			c('');
		});

		it('returns a parse object', function () {
			assert.isTrue(typeof c('') === 'object');
		});
	});
});