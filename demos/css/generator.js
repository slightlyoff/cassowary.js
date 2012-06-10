/**
 * Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
 * Use of this source code is governed by the LGPL, which can be found in the
 * COPYING.LGPL file.
 */

(function(scope) {
"use strict";

//////////////////////////////////////////////////////
//  Utility functions
//////////////////////////////////////////////////////

var global = function(id) {
  return scope.document.getElementById(id).contentWindow;
};
var doc = function(id) { return global(id).document; };

var weak = c.Strength.weak;
var medium = c.Strength.medium;
var strong = c.Strength.strong;
var required = c.Strength.required;

var eq  = function(a1, a2, strength, w) {
  return new c.LinearEquation(a1, a2, strength || weak, w||0);
};
var neq = function(a1, a2, a3) { return new c.LinearInequality(a1, a2, a3); };
var geq = function(a1, a2, str, w) { return new c.LinearInequality(a1, c.GEQ, a2, str, w); };
var leq = function(a1, a2, str, w) { return new c.LinearInequality(a1, c.LEQ, a2, str, w); };

var stay = function(v, strength, weight) { 
  return new c.StayConstraint(v, strength || weak, weight || 1.0);
};
var weakStay =   function(v, w) { return stay(v, weak, w); };
var mediumStay =   function(v, w) { return stay(v, medium, w); };
var strongStay =   function(v, w) { return stay(v, strong, w); };
var requiredStay = function(v, w) { return stay(v, required, w); };

//////////////////////////////////////////////////////
//  Types
//////////////////////////////////////////////////////

var defaultMediumWidth = 3;

var CSSValue = c.inherit({
  initialize: function(value, name) {
    this.value = value;
    this.name = name;
  },
  get px() {
    //console.log(this.name, ":", this.value, parseFloat(this.value));
    if (this.value == "auto") {
      // console.warn("providing 0 for auto on:", this.name);
      return 0;
    } else if (this.value.indexOf("px") >= 0) {
      return parseFloat(this.value);
    } else {
      console.warn("wrong px version of:", this.name, ":", this.value);
      // FIXME(slightlyoff):
      //      Convert to absolute pixels, taking into account current element
      //      EM/EN sizing, etc.
      return parseFloat(this.value);
    }
  },
  get str() { return this.value; },
  get raw() { return this.value; },
  toString: function() { return this.value; },
  get auto() { return this.value == "auto"; },
});

var MeasuredBox = c.inherit({
  initialize: function(top, left, right, bottom) {
    this.top =    top||0;
    this.left =   left||0;
    this.right =  right||0;
    this.bottom = bottom||0;
  },
  get width() { return this.right - this.left; },
  get height() { return this.bottom - this.top; },
});

var Box = c.inherit({
  initialize: function(top, left, right, bottom) {
    this._top =    new c.Variable(top||0);
    this._left =   new c.Variable(left||0);
    this._right =  new c.Variable(right||0);
    this._bottom = new c.Variable(bottom||0);
  },
  get top()    { return this._top.value(); },
  get left()   { return this._left.value(); },
  get right()  { return this._right.value(); },
  get bottom() { return this._bottom.value(); },
  get width()  { return this.right - this.left; },
  get height() { return this.bottom - this.top; },

  // FIXME(slightlyoff): need setters to over-ride the values for debugging!
});

var RenderBox = c.inherit({
  initialize: function(containing, prev, cs, node){
    this.edges = {
      ref: {
        margin:   new Box(),
        border:   new Box(),
        padding:  new Box(),
        content:  new Box(),
        // TODO(slightlyoff): support box-sizing by breaking these
        //                    assumptions!
        // outer:    new Box(), // margin == outer
        // inner:    new Box(), // content == inner
      },
      actual: {
        margin:   new Box(),
        border:   new Box(),
        padding:  new Box(),
        content:  new Box(),
      },
    };
    this.edges.ref.outer = this.edges.ref.margin;
    this.edges.ref.inner = this.edges.ref.content;

    this.edges.actual.outer = this.edges.actual.margin;
    this.edges.actual.inner = this.edges.actual.content;

    // The RenderBox we're relative to
    this.containing = containing;
    this.prev = prev;
    this.computedStyle = cs || null;
    this.node = node;
    this.naturalSize = contentSize(node);
    this.solver = this.solver || this.containing.solver;
  },

  toString: function() {
    var m = this.edges.actual.margin;
    return "RenderBox: { top: " + m.top +
                      ", right: " + m.right +
                      ", bottom:" + m.bottom +
                      ",left:" + m.left +
                      "}";
  },

  generate: function() {
    // Constraints for all boxes
    var ref = this.edges.ref;
    var actual = this.edges.actual;
    var solver = this.solver;
    var containing = this.containing.edges.actual;
    var constrain = solver.add.bind(solver);

    // solver.autoSolve = false;

    // FIXME(slightlyoff):
    //      Need to generate different rules for %-based values!

    // Michalowski '98, Section 3.1
    
    var mediumWidth = new c.Variable(defaultMediumWidth);

    var width = this.css("width");
    var _width = new c.Variable(width.raw);
    var height = this.css("height");
    var _height = new c.Variable(height.raw);

    var minWidth = this.css("min-width");
    var _minWidth = new c.Variable(minWidth.raw);
    var minHeight = this.css("min-height");
    var _minHeight = new c.Variable(minHeight.raw);

    var maxWidth = this.css("max-width");
    var _maxWidth = new c.Variable(maxWidth.raw);
    var maxHeight = this.css("max-height");
    var _maxHeight = new c.Variable(maxHeight.raw);

    var left = this.css("left");
    var _left = new c.Variable(left.raw);
    var right = this.css("right");
    var _right = new c.Variable(right.raw);
    var top = this.css("top");
    var _top = new c.Variable(top.raw);
    var bottom = this.css("bottom");
    var _bottom = new c.Variable(bottom.raw);

    var marginTop = new c.Variable(this.css("margin-top").raw);
    var marginRight = new c.Variable(this.css("margin-right").raw);
    var marginBottom = new c.Variable(this.css("margin-bottom").raw);
    var marginLeft = new c.Variable(this.css("margin-left").raw);

    var borderTop = new c.Variable(this.css("border-top").raw);
    var borderRight = new c.Variable(this.css("border-right").raw);
    var borderBottom = new c.Variable(this.css("border-bottom").raw);
    var borderLeft = new c.Variable(this.css("border-left").raw);

    var paddingTop = new c.Variable(this.css("padding-top").raw);
    var paddingRight = new c.Variable(this.css("padding-right").raw);
    var paddingBottom = new c.Variable(this.css("padding-bottom").raw);
    var paddingLeft = new c.Variable(this.css("padding-left").raw);

    constrain(
      eq(c.Minus(ref.content._top, this.css("padding-top").px),
        ref.padding._top,
        required
      ),
      eq(c.Minus(ref.content._left, this.css("padding-left").px),
        ref.padding._left,
        required
      ),
      eq(c.Plus(ref.content._right, this.css("padding-right").px),
        ref.padding._right,
        required
      ),
      eq(c.Plus(ref.content._bottom, this.css("padding-bottom").px),
        ref.padding._bottom,
        required
      )
    );

    constrain(
      eq(c.Minus(ref.padding._top, this.css("border-top-width").px),
        ref.border._top,
        required
      ),
      eq(c.Minus(ref.padding._left, this.css("border-left-width").px),
        ref.border._left,
        required
      ),
      eq(c.Plus(ref.padding._right, this.css("border-right-width").px),
        ref.border._right,
        required
      ),
      eq(c.Plus(ref.padding._bottom, this.css("border-bottom-width").px),
        ref.border._bottom,
        required
      )
    );

    constrain(
      eq(c.Minus(ref.border._top, this.css("margin-top").px),
        ref.margin._top,
        required
      ),
      eq(c.Minus(ref.border._left, this.css("margin-left").px),
        ref.margin._left,
        required
      ),
      eq(c.Plus(ref.border._right, this.css("margin-right").px),
        ref.margin._right,
        required
      ),
      eq(c.Plus(ref.border._bottom, this.css("margin-bottom").px),
        ref.margin._bottom,
        required
      )
    );

    // console.log("width:", width.raw);
    if (!width.auto) {
      constrain(
        eq(c.Plus(ref.content._left, width.px),
          ref.content._right,
          required
        )
      );
    }
    // console.log("height:", height.raw);
    if (!height.auto) {
      constrain(
        eq(c.Plus(ref.content._top, height.px),
          ref.content._bottom,
          required
        )
      );
    }

    constrain(eq(_width, this.naturalSize.width, medium));

    if (!width.auto) {
      // console.log("width:", width + "");
      constrain(eq(_width, width.px, strong));
    }

    constrain(eq(_height, this.naturalSize.height, medium));

    if (!height.auto) {
      // console.log("height:", height + "");
      constrain(eq(_height, height.px, strong));
    }

    [ marginTop, marginRight, marginBottom, marginLeft,
      paddingTop, paddingRight, paddingBottom, paddingLeft
    ].forEach(function(v) { constrain(eq(v, 0, weak)); });

    [ borderTop, borderRight, borderBottom, borderLeft
    ].forEach(function(v) { constrain(eq(v, mediumWidth, weak)); }); 


    ["margin", "border", "padding", "content"].forEach(function(type) {
      ["_left", "_top", "_right", "_bottom"].forEach(function(name) {
        // FIXME(slightlyoff): unsure how to make ref's variables read-only here!
        constrain(
          eq(actual[type][name], ref[type][name], strong)
        );
      });
    });

    constrain(
      geq(_width, 0, required),
      geq(_height, 0, required)
    );

    constrain(
      eq(_left, 0, weak),
      eq(_right, 0, weak),
      eq(_top, 0, weak),
      eq(_bottom, 0, weak)
    );


    // FIXME(slightlyoff):
    //  Missing 9.5 items for floated boxes

    // Michalowski '98, Section 3.3
    // Normally-positioned Block boxes
    //
    // TODO(slightlyoff)
    //
    
    // Michalowski '98, Section 3.4
    // Position-based Constraints
    //
    // TODO(slightlyoff)
    //
    var pos = this.css("position");
    // console.log("pos:", pos+" {", top+"", right+"", bottom+"", left+" }");
    if (pos == "relative") {
      if (!top.auto) {
        constrain(
          eq(actual.margin._top,
            c.Plus(ref.margin._top, top.px),
            required
          )
        );
      }
      if (!left.auto) {
        constrain(
          eq(actual.margin._left,
            c.Plus(ref.margin._left, left.px),
            required
          )
        );
      }
      if (!right.auto) {
        constrain(
          eq(actual.margin._right,
            c.Minus(ref.margin._right, right.px),
            required
          )
        );
      }
      if (!bottom.auto) {
        constrain(
          eq(actual.margin._bottom,
            c.Minus(ref.margin._bottom, bottom.px),
            required
          )
        );
      }
    } else if(pos == "absolute" || pos == "fixed") {
      if (!top.auto) {
        constrain(
          eq(
            actual.margin._top,
            c.Plus(containing.margin._top, top.px),
            required
          )
        );
      }
      if (!left.auto) {
        constrain(
          eq(actual.margin._left,
            c.Plus(containing.margin._left, left.px),
            required
          )
        );
      }
      if (!right.auto) {
        constrain(
          eq(actual.margin._right,
            c.Minus(containing.margin._right, right.px),
            required
          )
        );
      }
      if (!bottom.auto) {
        constrain(
          eq(actual.margin._bottom,
            c.Minus(containing.margin._bottom, bottom.px),
            required
          )
        );
      }
    }

    //
    // TODO(slightlyoff)
    //

    // solver.autoSolve = true;
    // solver.resolve();
  },

  //  getComputedStyle returns USED width/height/etc. (post-layout) in the
  //  original document, not the COMPUTED width/height/etc. This defeats our
  //  engine entirely. To avoid writing a parser and resolver, we require
  //  (for now) that all the following styles be declared *on the elements
  //  themselves* or on simple in-document ID rules:
  //    background-position
  //    bottom, left, right, top
  //    height, width
  //    margin-bottom, margin-left, margin-right, margin-top,
  //    min-height, min-width
  //    padding-bottom, padding-left, padding-right, padding-top
  //    text-indent
  //  
  //  This means that we effectively only support these styles when written as:
  //
  //    <style>
  //        #thinger {
  //            left: 100px;
  //            ...
  //        }
  //    </style>
  //    <div id="thinger" style="width: 500px; height 500px;">...</div>
  //  
  //  See also:
  //      https://developer.mozilla.org/en/DOM/window.getComputedStyle
  //      https://developer.mozilla.org/en/CSS/used_value
  //      https://developer.mozilla.org/en/CSS/computed_value
  css: function(propertyName) {
    var value;
    var node = (this.node.nodeType == 1) ? this.node : this.node.parentNode;
    if (this._localCssProperties.indexOf(propertyName) >= 0) {
      // We don't trust getComputedStyle since it returns used values for these
      // properties, so we instead look to see what the node itself has
      // specified.
      value = node.style[toCamelCase(propertyName)];


      // If we don't get something from the node, we try to honour ID-targeted
      // rules. We're not looking to understand "!important", settle ordering
      // issues, handle linked sheets, etc. This is purely a hack.
      if (!value) {
        // FIXME: expensive, cache!
        value = "auto";
        var id = this.node.id;
        if (id) {
          var idRe = new RegExp("\#"+id+"\\s*{");
          toArray(node.ownerDocument.styleSheets).forEach(function(sheetList) {
            toArray(sheetList).forEach(function(sheet) {
              toArray(sheet.cssRules).forEach(function(rule) {
                if (rule.type == 1) {
                  if (rule.cssText.search(idRe) == 0) {
                    var tv = rule.style[toCamelCase(propertyName)];
                    if (tv) {
                      value = tv;
                    }
                  }
                }
              });
            });
          });
        }
      }
    } else {
      value = this.computedStyle.getPropertyValue(propertyName);
    }

    /*
    if(value.indexOf("%") >= 0) {
      // Walk the DOM to resolve what we're a % *of*
      var pct = parseFloat(value);
      var dv = node.ownerDocument.defaultView;
      var cs = dv.getComputedStyle(node.parentNode, null);
      console.log(cs, propertyName, cs.getPropertyValue(propertyName));

      // pctOf = this.computedStyle.getPropertyValue(propertyName);
      // console.log(value);
    }
    */

    return new CSSValue(value, propertyName);
  },
  _localCssProperties: [
    "background-position",
    "bottom", "left", "right", "top",
    "height", "width", "min-height", "min-width",
    "margin-bottom", "margin-left", "margin-right", "margin-top",
    "padding-bottom", "padding-left", "padding-right", "padding-top",
    "text-indent"
  ],

});

var LineBox = c.inherit({
  extends: RenderBox,
  initialize: function(containing, prev, text, cs, node){
    this.text = text;
    RenderBox.call(this, containing, prev, cs, node);
  },
  generate: function() {
    // TODO(slightlyoff):
    //      set our top to the prev's top or the containing's content top (or
    //      whatever makes sense based on text-align)

    // Michalowski '98, Section 3.2
    // Line-box Constraints

    // FIXME(slightlyoff): need to add the float constraints back in!
 
    // c.top + this.css("line-height").px;
    // console.log(this.naturalSize.width, this.naturalSize.height);

    var ref = this.edges.ref;
    var actual = this.edges.actual;
    var solver = this.solver;
    var constrain = solver.add.bind(solver);
    var containing = this.containing.edges.actual;

    var _width = new c.Variable();
    var _height = new c.Variable();

    constrain(eq(_width, this.naturalSize.width, medium));
    constrain(eq(_height, this.naturalSize.height, medium));

    // FIXME: need to find some way to linearize the following if/else:
    // if (previous.RM + width <= enclosing.RP) {
    //   // If we're not going to intersect the right-hand-side of our
    //   // container, put our left at the previous right and or top at the
    //   // previous top.
    //   ref.TM = previous.RM?
    //   ref.LM = previous.TM?
    // } else {
    //   // Else, drop down a line and go flush left.
    //   ref.TM = previous.BM?
    //   ref.LM = 0
    // }
    //
    // http://www.aimms.com/aimms/download/manuals/aimms3om_integerprogrammingtricks.pdf

    constrain(
      eq(actual.content._top, this.prev.edges.actual.content._top, strong),
      eq(actual.content._left, this.prev.edges.actual.content._right, strong)
    );

    constrain(
      eq(c.Plus(actual.content._left, _width), actual.content._right, required),
      eq(c.Plus(actual.content._top, _height), actual.content._bottom, required)
    );

    constrain(
      geq(containing.content._right, actual.content._right, strong),
      geq(containing.content._top, actual.content._bottom, strong)
    );
  },
});

var Viewport = c.inherit({
  extends: RenderBox, 
  initialize: function(width, height, cs, node){
    // Viewport:
    //  The item that everything else is realtive to. It takes a source node
    //  whose dimensions it copies, setting margin/padding/border to zero.
    this.solver = new c.SimplexSolver();
    RenderBox.call(this, this, null, cs, node);
    this.naturalSize = new MeasuredBox(0, 0, width, height);
    this.generate();
  },

  generate: function() {
    var actual = this.edges.actual;
    var solver = this.solver;
    var width = this.naturalSize.width;
    var height = this.naturalSize.height;
    var constrain = solver.add.bind(solver);

    ["margin", "border", "padding", "content"].forEach(function(type) {
      constrain(
        eq(actual[type]._left, 0, required),
        eq(actual[type]._top, 0, required),
        eq(actual[type]._right, width, required),
        eq(actual[type]._bottom, height, required)
      );
    });
  },
});

//////////////////////////////////////////////////////
//  Workhorse functions
//////////////////////////////////////////////////////

var findBoxGenerators = function(element, doc, global) {
  doc = doc || document;
  global = global || scope;
  var NodeFilter = global.NodeFilter;
  var generators = [];
  var nf = NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_DOCUMENT;

  var tw = doc.createTreeWalker(
    element,
    nf,
    {
      acceptNode: function(node) {
        // Filter on elements that have some sort of display
        if (node.nodeType == 1) {
          var cs = global.getComputedStyle(node);
          if (cs.getPropertyValue("display") == "none") {
            return NodeFilter.FILTER_REJECT;
          }
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    },
    false);

  while(tw.nextNode()) {
    generators.push(tw.currentNode);
  }
  return generators;
};

// *Super*-hacky content measurement. Known-busted in the following ways:
//  - does not cascade font sizing/family/line-height/etc. information
//  - likely breaks any/all :before and :after rules
//  - does not measure generated content
//  - probably broken on tables and other element types that need specific
//    hosting parents
// The right answer, of course, is to just plumb through a measurement API from
// WebKit directly and use this only in case of fallback.
var docMeasureNodeMap = new Map();
var getMeasureNode = function(doc) {
  var mn = docMeasureNodeMap.get(doc);
  if (mn) return mn;

  var mn = doc.createElement("div");
  mn.style.display = "inline-block";
  mn.style.position = "absolute";
  mn.style.left = "-5000px";
  mn.style.top = "-5000px";
  mn.style.visibility = "hidden";
  mn.style.pointerEvents = "none";
  mn.style.padding = "0px";
  mn.style.border = "0px";
  mn.style.margin = "0px";
  doc.documentElement.appendChild(mn);
  docMeasureNodeMap.set(doc, mn);
  return mn;
};

var contentSize = function(node) {
  var w = 0,
      h = 0,
      doc = node.ownerDocument;
  var m = getMeasureNode(doc);
  m.innerHTML = "";
  var c = node.cloneNode(true);
  if (c.nodeType == 1) {
    c.style.width = "auto !important";
    c.style.height = "auto !important";
  }
  m.appendChild(c);
  return new MeasuredBox(0, 0, m.scrollWidth, m.scrollHeight);
};

var _generateFor = function(id, boxesCallback) {
  // TODO(slightlyoff):
  //    Make generic by allowing the current document/scope to be
  //    generated for in addition to same-domain iframes.
  var g = global(id);
  if (!g) {
    console.log("FAIL: couldn't script other window!");
    return;
  }
  var d = doc(id),
      visibleNodes = findBoxGenerators(d.documentElement, d, g);

  // console.log(visibleNodes);

  var vn = document.getElementById(id);
  var dde = d.documentElement;
  var v = new Viewport(vn.clientWidth, vn.clientHeight, g.getComputedStyle(dde), dde);

  // Run through the visible nodes, creating box types as needed and setting
  // forward/back/ref references.

  // The most recent document-ordered element that is not absolute, fixed, or float
  var prev = null;
  var containing = v;
  var containingNode = dde;
  var containingStack = [{ box: v, node: containingNode }];
  var boxes = [];

  visibleNodes.forEach(function(node) {
    switch (node.nodeType) {
      case 1: // Element
        // FIXME(slightlyoff):
        //      Need to create render boxes for generated content, so need to
        //      test for :before and :after when we get the computed style for
        //      each node.
        var b = new RenderBox(containing, prev, g.getComputedStyle(node), node);
        var pos = b.css("position");
        if (pos != "absolute" && pos != "fixed" && pos != "float") {
          prev = b;
        }
        if (pos == "absolute" || pos == "relative" || pos == "float") {
          while (!containingNode.contains(node)) {
            var csi = containingStack.pop();
            // console.log("popped:", csi);
            containingNode = csi.node;
            containing = csi.box;
            // FIXME: how does this affect prev?
          }
          containingStack.push({ box: b, node: node });
          // console.log("pushed:", containingStack[containingStack.length - 1]);
          containingNode = node;
          containing = b;
        }
        boxes.push(b);
        // FIXME(slightlyoff):
        //      If our pos isn't the default, we are the new "containing" for
        //      children.
        return;
      case 3: // TextNode

        //  Could *really* do with access to these right about now:
        //   http://msdn.microsoft.com/en-us/library/windows/desktop/dd319118(v=vs.85).aspx
        //   http://developer.apple.com/library/mac/#documentation/Carbon/Reference/CTLineRef/Reference/reference.html

        var head = node;
        var tail = null;
        var pn = node.parentNode;
        var cs = g.getComputedStyle(node.parentNode);
        node.nodeValue.split(/\s+/).forEach(function(word) {
          if (!word) { return; }
          // Next, find the index of the current word in our remaining node,
          // split on the word end, and create LineBox items for the newly
          // split-off head element.
          var hnv = head.nodeValue;
          if (hnv.indexOf(word) >= 0) {
            tail = head.splitText(hnv.indexOf(word)+word.length);
            var b = new LineBox(containing, prev, head.nodeValue, cs, head)
            boxes.push(b);
            prev = b;
          }
          head = tail;
        });
        return;
      default:
        // console.log("WTF?:", node);
        break;
    }
    // console.log("'" + node.nodeValue + "'", b.naturalSize.width, b.naturalSize.height);
    // console.log("natural size:", b.naturalSize.width, b.naturalSize.height, "node type:", node.nodeType);
  });

  boxes.forEach(function(box) {
  });

  // TODO(slightlyoff): sort boxes into stacking contexts for rendering!
  //                    See CSS 2.1 section E.2 for details.

  boxes.unshift(v);

  boxes.forEach(function(box) { box.generate(); });

  boxesCallback(boxes);
};

scope.generateFor = function(id, boxesCallback) {
  ready(function() { _generateFor(id, boxesCallback) }, id);
};

})(this);
