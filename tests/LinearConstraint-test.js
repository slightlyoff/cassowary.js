// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

"use strict";

c1 = new c.LinearEquation(ex);
print(c1);

var x = new c.Variable(167);
var y = new c.Variable(2);
var cly = new c.LinearExpression(y);
cly.addExpression(x);

var x = new c.Variable(167);
var y = new c.Variable(2);
var cly = new c.LinearExpression(y);
var eq = new c.LinearEquation(x, cly);
print(eq);
