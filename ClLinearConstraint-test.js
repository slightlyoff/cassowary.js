
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
