// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2011, Alex Rusell (slightlyoff@chromium.org)

x = new c.Variable("x",167);
y = new c.Variable("y",2);

e = new c.LinearExpression(x, 2, 3);
print('e='+e);

e0 = new c.LinearExpression(4);
print('e0='+e0);

e1 = c.Plus(4,2);
print('e1='+e1);

e2 = c.Plus(x,2);
print('e2='+e2);

e3 = c.Plus(3,x);
print('e3='+e3);

e4 = c.Times(x,3);
print('e4='+e4);

e5 = c.Times(7,x);
print('e5='+e5);

ex = c.Plus(4, c.Plus(c.Times(x,3), c.Times(2,y)));
print('ex='+ex);
