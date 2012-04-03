Cassowary JS
============

This is an updated version of [Greg Badros's
port](http://www.badros.com/greg/cassowary/js/quaddemo.html "JS Quad Demo") of
the [Cassowary hierarchial constraint
toolkit](http://www.cs.washington.edu/research/constraints/cassowary/) to
[JavaScript](http://cassowary.cvs.sourceforge.net/viewvc/cassowary/cassowary/js/).

This fork dramatically improves the performance of the original mechanical
translation (8x under V8, 5x under Rhino), removing external library
dependencies while improving hackability. The solver core can now be used
inside web workers and many modern browsers.

For discussion, questions on how to use the solver, and a small but civil
community of folks working in this space is forming on the [Overconstrained
mailing list](https://groups.google.com/forum/?fromgroups#!forum/overconstrained).

Constraint Solver? Say What?
----------------------------

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
---------------

This repo pulls in other Git repositories through [submodules](http://help.github.com/submodules/), so after cloning the repo, issue the following commands:

```
$ git submodule init
$ git submodule update
...
```

To run the tests, point your thorougly modern browser at `tests/unittests.html`
or `demos/quad/quaddemo.html`. To run from the command line, first, see if they
already run without any extra work (they should on most Mac or Linux boxes):

```
$ cd tests
$ ./run.sh
...
```

If you get an error like: 

```
$ ./run.sh 
FAILED: No JavaScript Runtime Found! Please install Java or the V8 Shell (d8) and add them to your $PATH
```

Check out a copy of V8 and building the latest debugging shell:

`scons snapshot=on console=readline objectprint=on d8`

This make take a while and yes, it requires Scons (which implies a Python
dependency) and a sane C++ compiler in your PATH. Now add the directory with
the `d8` executable to your PATH for running the unit tests.

Then invoke the command-line test runner from inside the test directory:

```
$ cd tests
$ ./run.sh
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
your path and attempt to fall back to using Rhino to run the tests. If it's not
working out of the box, check to ensure that Java is installed and in your
PATH.

Supported Runtimes
------------------

This refactoring currently runs in:

  * Chrome (and Chrome Frame)
  * Firefox 9+
  * Opera 11+
  * Safari 5+
  * IE 9+
  * Command-line:
    * V8 (d8 shell)
    * JSC (built into OS X)
    * Rhino (Java) js.jar included in checkout

This is an unapolgetically modern reinterpretation optimized for size, low
complexity, and speed. And litle else. No, it will not work on old versions of
IE. Get [Chrome Frame](http://google.com/chromeframe) ;-) The idioms in use are
tracking dev-channel Chrome and as soon as ES.next features become available
there, this port will begin to use them. You have been warned.

Configuration
-------------

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
---

TODO(slightlyoff)
