// Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
//
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.

(function() {

"use strict";

doh.add("c", [

  function _inc(t) {
    var v = c._inc();
    t.is(v+1, c._inc());
  },

  function own(t) {
    var p = { thinger: true };
    var C = function() {
      this.ownProp = true;
    };
    C.prototype = Object.create(p);
    var o = new C();
    var count = 0;
    c.own(o, function() { count++; })
    t.is(1, count);
  },

  function extend(t) {
    var o = {};
    t.is({}, o);

    var ctr = 0;
    var props = {
      get foo() {
        return "foo";
      },
      set foo(v) {
        ctr++;
      },
      key: "value",
      method: function() {
        return "function";
      }
    };

    c.extend(o, props);
    t.is(0, ctr);
    o.foo = 10;
    t.is(1, ctr);
    props.foo = 10;
    t.is(2, ctr);

    var keyPd = Object.getOwnPropertyDescriptor(o, "key");
    t.is(true, keyPd.writable);
    t.is(true, keyPd.configurable);
    t.is(true, keyPd.enumerable);
    t.is("string", typeof keyPd.value);
    t.is("value", keyPd.value);

    var methodPd = Object.getOwnPropertyDescriptor(o, "method");
    t.is(true, methodPd.writable);
    t.is(true, methodPd.configurable);
    t.is(false, methodPd.enumerable);
    // print(Object.keys(methodPd));
    t.is("function", typeof methodPd.value);

    var getSetPd = Object.getOwnPropertyDescriptor(o, "foo");
    t.is("function", typeof getSetPd.set);
    t.is("function", typeof getSetPd.get);
    t.is(true, getSetPd.enumerable);
    t.is(true, getSetPd.configurable);
  },

  function inherit(t) {
    var Classic = function() {
      this.i = c._inc();
    }
    Classic.prototype = {
      superProtoProp: true,
    };
    var props = {
      _t: "Whatevs",
      initialize: function() {
        Classic.call(this);
      },
      extends: Classic,

      inc: function() {
        return ++this.i;
      },

      set value(value) {
        this._value = value;
      },

      get value() {
        return this._value;
      },
    };
    var C = c.inherit(props);
    t.is(undefined, props.initialize);
    t.is(undefined, props.extends);

    var i = new C();
    var j = new C();
    var v = i.i;
    t.is(v+1, j.i);
    t.t(i.superProtoProp);
    Classic.prototype.superProtoProp = 10;
    t.is(10, i.superProtoProp);

    t.is(v+1, i.inc());
    t.is(v+2, i.inc());

    i.value = "thinger";
    t.is("thinger", i.value);
    t.is("thinger", i._value);
  },

  /*
  function fromJSON(t) {
    var solver = new c.SimplexSolver();

    var x = new c.Variable({ value: 10 });
    var width = new c.Variable({ value: 10 });
    var right = new c.Expression(x).plus(width);
    var ieq = new c.Inequality(100, c.LEQ, right);

    solver.addStay(width)
          .addConstraint(ieq);

    t.is(x.value, 90);
    t.is(width.value, 10);
  },
  */

  function basicJSON(t) {
    var symbolicZeroValue = c.SymbolicWeight.clsZero.value;
    t.is({ _t: "c.SymbolicWeight", value: symbolicZeroValue },
         c.SymbolicWeight.clsZero.toJSON());

    var solver = new c.SimplexSolver();

    var x = new c.Variable({ value: 10 });
    var width = new c.Variable({ value: 10 });
    var right = new c.Expression(x).plus(width);
    var ieq = new c.Inequality(100, c.LEQ, right);

    solver.addStay(width)
          .addConstraint(ieq);

    var ir = solver._infeasibleRows;
    t.is('{"_t":"c.HashSet","data":[]}', JSON.stringify(ir));

    t.is(
      { _t: "c.HashSet",
        data: [
                  { _t: "c.Variable", name: "v6", value: 10 },
                  { _t: "c.Variable", name: "v5", value: 90 }
        ]
      },
      solver._externalRows.toJSON()
    );

    // Smoke test
    var rehydratedER = c.parseJSON(JSON.stringify(solver._externalRows));
    // FIXME(slightlyoff):
    //    need to filter out the "hashCode" property for deep equality test
    // t.is(rehydratedER, solver._externalRows);
  },

  /*
  // TODO(slightlyoff)
  function Assert(t) {

  },

  function Plus(t) {

  },

  function Minus(t) {

  },

  function Times(t) {

  },

  function Divide(t) {

  },
  */
]);

})();
