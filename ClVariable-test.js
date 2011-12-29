// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

/* TEST */

c.Variable._map = [];
x = new c.Variable("x");
y = new c.Variable("y", 2);
print ((c.Variable._map)['x'])

d = new c.DummyVariable("foo");
print(d);

o = new c.ObjectiveVariable("obj");
print(o);
