// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.

c1 = new c.SymbolicWeight(1,1,1);
c2 = new c.SymbolicWeight(2,3,4);

c3 = c1.add(c2);
print(c3);
print(c3.times(4));
