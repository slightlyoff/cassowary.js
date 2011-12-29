/* TEST */

c.Variable._map = [];
x = new c.Variable("x");
y = new c.Variable("y", 2);
print ((c.Variable._map)['x'])

d = new c.DummyVariable("foo");
print(d);

o = new c.ObjectiveVariable("obj");
print(o);
