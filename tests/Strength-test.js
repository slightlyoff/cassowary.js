// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Rusell (slightlyoff@chromium.org)

"use strict";

doh.add("c.Strength", [
  function constants(t) {
    t.t(c.Strength.required instanceof c.Strength);
    t.t(c.Strength.strong instanceof c.Strength);
    t.t(c.Strength.medium instanceof c.Strength);
    t.t(c.Strength.weak instanceof c.Strength);
  },

  function isRequired(t) {
    t.t(c.Strength.required.isRequired());
    t.f(c.Strength.strong.isRequired());
    t.f(c.Strength.medium.isRequired());
    t.f(c.Strength.weak.isRequired());
  },
  // FIXME(slightlyoff): MOAR TESTS
]);

