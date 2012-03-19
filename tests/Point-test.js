// Copyright (C) 1998-2000 Greg J. Badros
// Use of this source code is governed by the LGPL, which can be found in the
// COPYING.LGPL file.
//
// Parts Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)

"use strict";

doh.add("c.Point", [
  function ctor(t) {
    new c.Point(4,7);
    new c.Point(3,5,"1");
  },
  // FIXME(slightlyoff): MOAR TESTS
]);
