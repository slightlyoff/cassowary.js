// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

c1 = new ClLinearEquation(ex);
print(c1);

var x = new ClVariable(167);
var y = new ClVariable(2);
var cly = new ClLinearExpression(y);
cly.addExpression(x);

var x = new ClVariable(167);
var y = new ClVariable(2);
var cly = new ClLinearExpression(y);
var eq = new ClLinearEquation(x, cly);
print(eq);
