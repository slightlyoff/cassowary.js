Cassowary JS
------------

This is an updated version of [Greg Badros's
port](http://www.badros.com/greg/cassowary/js/quaddemo.html "JS Quad Demo") of
the [Cassowary hierarchial constraint
toolkit](http://www.cs.washington.edu/research/constraints/cassowary/) to
[JavaScript](http://cassowary.cvs.sourceforge.net/viewvc/cassowary/cassowary/js/).
The work is happening here as I want nothing to do with either CVS or
sourceforge.

This fork removes many of the spurious library dependencies of previous
versions and improves the overall code style. Work is underway to remove the
remainder of the 3rd-party libaraies, make the solving core suitable for use
inside web workers, and to improve the performance of the code by a large
constant factor.

Say What?
=========

Constraint solvers are iterative algorithms that work towards ever more ideal
solutions, often using some variant of Dantzig's [simplex
method](http://en.wikipedia.org/wiki/Simplex_algorithm). They are primarialy of
interest in situations where it's possible to easily set up a set of rules
which you would like a solution to adhere to, but when it is very difficult to
consider all of the possible solutions yourself.

Cassowary and other hierarchial constraint toolkits add a unique mechanism for
deciding between sets of rules that might conflict in determining which of a
set of possible solutions are "better". By allowing constraint authors to
specify *weights* for the constraints, the toolkit can decide in terms of
*stronger* constraints over weaker ones, allowing for more optimal solutions.
These sorts of situations arise *all the time* in UI programming; e.g.: "I'd
like this to be it's natural width, but only if that's smaller than 600px, and
never let it get smaller than 200px". Constraint solvers offer a way out of the
primordial mess of nasty conditionals and brittle invalidations.

If all of this sounds like it's either deeply esoteric or painfully academic,
you might start by boning up on what optimizers like this do and what they're
good for. I recommend John W. Chinneck's ["Practical Optimization: A Gentle
Introduction"](http://www.sce.carleton.ca/faculty/chinneck/po.html) and the
Cassowary paper that got me into all of this: ["Constraint Cascading Style
Sheets for the
Web"](http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.101.4819)
