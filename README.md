Cassowary JS
------------

This is an updated version of [Greg Badros's
port](http://www.badros.com/greg/cassowary/js/quaddemo.html "JS Quad Demo") of
the [Cassowary hierarchial constraint
toolkit](http://www.cs.washington.edu/research/constraints/cassowary/) to
[JavaScript](http://cassowary.cvs.sourceforge.net/viewvc/cassowary/cassowary/js/).

This fork removes any external library dependencies and improves the overall
code style. Work is underway to make the solving core suitable for use inside
web workers and to improve the performance of the code by a large constant
factor. This version is already 8x faster than the original at running the
built-in test suite under V8 (5x faster under Rhino).

Constraint Solver? Say What?
============================

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

Getting Started
===============

To run the tests, check out this repository and point your thorougly modern
browser at `unittests.html` or `quaddemo.html`. To run from the command line,
check out a copy of V8 and building the latest debugging shell:

`scons snapshot=on console=readline objectprint=on d8`

Now add the directory with the `d8` executable to your PATH for running the unit tests.

Then invoke the command-line test runner with:

```
obelisk:cassowary-js-refactor slightlyoff$ cd tests
obelisk:tests slightlyoff$ ./run.sh
...
done adding 63 constraints [500 attempted, 0 exceptions]
time = 0.021
done adding 63 constraints [500 attempted, 0 exceptions]
time = 0.023
Editing vars with indices 70, 56
about to start resolves
done resolves -- now ending edits
total time = 0.325

  number of constraints:             100
  number of solvers:                  10
  numbers of resolves:                50
  tests:                               1
  time to add (ms):                   23
  time to edit (ms):                   5
  time to resolve (ms):               62
  time to edit (ms):                   2
  add time per solver (ms):        0.023
  edit time per solver (ms):        0.25
  resolve time per resolve (ms):   0.124
  time to end edits per solver (ms): 0.1
```

If you would like to avoid building V8 but have Java installed, a copy of Rhino
(`js.jar`) is included in this repo. `run.sh` should detect that `d8` is not in
your path and attempt to fall back to using Rhino to run the tests.

Supported Runtimes
==================

This is an unapolgetically modern reinterpretation, optimized for size,
complexity, and speed. And litle else. No, it won't work on IE < 10. Or
old-skool Firefox. The idioms in use are tracking dev-channel Chrome and as
soon as ES.next features become available there, this port will begin to use
them. You have been warned.

Configuration
=============

```
// Log general debugging information
c.debug = [ false || true ]; // default false
// Detailed logging
c.trace = [ false || true ]; // default false
// Verbose logging
c.verbose = [ false || true ]; // default false
// Logging of tableau additions
c.traceAdded = [ false || true ]; // default false
// Logging of ...?
c.GC = [ false || true ]; // default false
```

TODO(slightlyoff): show how to set configuration information through command line and in the tests.

API
===

TODO(slightlyoff)
