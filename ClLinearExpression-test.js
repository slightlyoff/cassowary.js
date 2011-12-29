
x = new ClVariable("x",167);
y = new ClVariable("y",2);

e = new ClLinearExpression(x, 2, 3);
print('e='+e);

e0 = new ClLinearExpression(4);
print('e0='+e0);

e1 = CL.Plus(4,2);
print('e1='+e1);

e2 = CL.Plus(x,2);
print('e2='+e2);

e3 = CL.Plus(3,x);
print('e3='+e3);

e4 = CL.Times(x,3);
print('e4='+e4);

e5 = CL.Times(7,x);
print('e5='+e5);

ex = CL.Plus(4, CL.Plus(CL.Times(x,3),CL.Times(2,y)));
print('ex='+ex);
