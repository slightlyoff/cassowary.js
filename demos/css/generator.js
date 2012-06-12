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
var _localCssProperties = [
  "background-position",
  "bottom", "left", "right", "top",
  "height", "width", "min-height", "min-width",
  "margin-bottom", "margin-left", "margin-right", "margin-top",
  "padding-bottom", "padding-left", "padding-right", "padding-top",
  "text-indent"
];
var css = function(propertyName, node) {
  var value;
  if (!node && this.node) {
    node = this.node;
  }
  node = (node.nodeType == 1) ? node : node.parentNode;
  if (_localCssProperties.indexOf(propertyName) >= 0) {
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
      var id = node.id;
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
    value = node.ownerDocument.defaultView.getComputedStyle(node).getPropertyValue(propertyName);
  }
  return new CSSValue(value, propertyName);
};

var isElement = function(n) {
  return n.nodeType == 1;
};

var isBlock = function(n) {
  if (!isElement(n)) return false;
  return (
    css("display", n).raw == "block" ||
    css("display", n).raw == "list-item" ||
    css("display", n).raw.indexOf("table") == 0
  );
};

var isInline = function(n) {
  if (!isElement(n)) return false;
  return (
    css("display", n).raw == "inline" ||
    css("display", n).raw == "inline-block" ||
    css("display", n).raw == "inline-table" ||
    css("display", n).raw == "ruby"
  );
};

var isFixed = function(n) {
  if (!isElement(n)) return false;
  return (css("position", n).raw == "fixed");
};

var isPositioned = function(n) {
  // TODO(slightlyoff): should floated elements be counted as positioned here?
  if (!isElement(n)) return false;
  return (
    css("position", n).raw == "fixed" ||
    css("position", n).raw == "absolute" ||
    css("position", n).raw == "center" ||
    css("position", n).raw == "page" // TODO(slightlyoff)
  );
};

var isFlowRoot = function(n) {
  if (!isElement(n)) return false;
  return (
    css("float", n).raw != "none" ||
    css("overflow", n).raw != "visible" || // FIXME: need to get USED value!
    css("display", n).raw == "table-cell" ||
    css("display", n).raw == "table-caption" ||
    css("display", n).raw == "inline-block" ||
    css("display", n).raw == "inline-table" ||
    (
      css("position", n).raw != "static" &&
      css("position", n).raw != "relative"
    )
    // FIXME:
    //      Need to account for "block-progression" here, but WebKit
    //      doesn't support it yet, so it's not accessible through the DOM.
  );
};

var isInFlow = function(n) {
  if (!isElement(n)) return false;
  return (
    ( // FIXME: need to get USED values here!
      css("display", n).raw == "block" ||
      css("display", n).raw == "list-item" ||
      css("display", n).raw == "table"
    ) &&
    css("float", n).raw == "none" &&
    (
      css("position", n).raw == "static" ||
      css("position", n).raw == "relative"
    )
    // FIXME:
    //  "4. It is either a child of the flow root or a child of a box that
    //  belogs to the flow."
  );
};

var isRunIn = function(n){
  // TODO(slightlyoff)
  return false;
};

var DEFULT_MEDIUM_WIDTH = 3;

//////////////////////////////////////////////////////
//  Types
//////////////////////////////////////////////////////

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

/*

// What follows are prototypical outlines of the class structure we want to be
// dealing with.

// FlowRoot mixin.
var FlowRoot = function() {
  this.flowRoot = true;
  this.flowBoxes = [];
  this.flow = function() {
    // ...
  };
};

var RenderBox = c.inherit({
  initialize: function(node, containingBlock){
    this.node = node;
    this.containingBlock = containingBlock;
    if (isFlowRoot(node)) {
      FlowRoot.call(this);
    }
  },
  _className: "RenderBox",
  get global() {
    return this.node.ownerDocument.defaultView;
  },
  css: css,
});

var FlowRoot = c.inherit({
  extends: RenderBox,
  _className: "FlowRoot",
})

var Block = c.inherit({
  extends: RenderBox,
  _className: "Block",
  initialize: function(node, containingBlock){
    RenderBox.call(this, node, containingBlock);
  },
});

var Inline = c.inherit({
  extends: RenderBox,
  _className: "RenderBox",
});

var AnonymousBlock = c.inherit({
  extends: Block,
  _className: "AnonymousBlock",
  ...
});

var LineBox = 
*/

// FlowRoot mixin.
var FlowRoot = function() {
  console.log("I'm a flow root!", this.node);

  this.blockProgression = "tb";
  this.flowRoot = true;
  this.flowBoxes = [];
  this.flow = function() {
    // 
    // "So here we go now
    //  Holla if ya hear me though
    //  Come and feel me, flow" -- NBN
    // 
 
    // console.log("flowing in:", this.node);

    if (!this.flowBoxes.length) { return; }

    var ref = this.edges.ref;
    var actual = this.edges.actual;
    var containing = actual;
    var solver = this.solver;
    var constrain = solver.add.bind(solver);

    var last;

    this.flowBoxes.forEach(function(child) {
      console.log("flowing:", child.node);

      /*
      if (!isInFlow(child.node)) {
        console.warn("not in flow!", child.node);
        return;
      }
      */

      switch(this.blockProgression) {
        case "tb":
          // Left and right edges of our block children are our content
          // left/right.
          constrain(
            eq(child.edges.ref.margin._left, containing.content._left, strong),
            eq(child.edges.ref.margin._right, containing.content._right, strong)
          );

          // Next, top is the previous bottom, else containing's content top;
          if (last) {
            constrain(
              eq(child.edges.ref.margin._top, last.edges.ref.margin._bottom, strong)
            );
          } else {
            constrain(
              eq(child.edges.ref.margin._top, containing.content._top, strong)
            );
          }
          last = child;

          // TODO(slightlyoff): margin collapsing!
          break;
        case "rl": // TODO(slightlyoff)
        case "bt": // TODO(slightlyoff)
        case "lr": // TODO(slightlyoff)
        default:
          console.warn("Unsupported block-progression:",
                       this.blockProgression);
          break;
      }
    }, this);
  };
};

var RenderBox = c.inherit({
  initialize: function(node, containingBlock){
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

    // The RenderBox we're relative to.
    // TODO: Is this our flow root?
    //
    this.containingBlock = containingBlock;
    // this.prev = prev;
 
    this.node = node;
    this.naturalSize = contentSize(node);
    this.solver = this.solver || this.containingBlock.solver;

    if (isFlowRoot(node)) {
      FlowRoot.call(this);
    }
  },
  get computedStyle() {
    return this.node.ownerDocument.defaultView.getComputedStyle(this.node);
  },

  _className: "RenderBox",

  toString: function() {
    var m = this.edges.actual.margin;
    return this._className + ": { top: " + m.top +
                               ", right: " + m.right +
                               ", bottom:" + m.bottom +
                               ", left:" + m.left + " }";
  },
  // Hack.
  css: css,

  generate: function() {
    // Constraints for all boxes
    var ref = this.edges.ref;
    var actual = this.edges.actual;
    var solver = this.solver;
    var containing = this.containingBlock.edges.actual;
    var constrain = solver.add.bind(solver);

    // FIXME(slightlyoff):
    //      Need to generate different rules for %-based values!

    // Michalowski '98, Section 3.1
    
    var _mediumWidth = new c.Variable("mediumWidth", DEFULT_MEDIUM_WIDTH);

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

    var _marginTop = new c.Variable(this.css("margin-top").raw);
    var _marginRight = new c.Variable(this.css("margin-right").raw);
    var _marginBottom = new c.Variable(this.css("margin-bottom").raw);
    var _marginLeft = new c.Variable(this.css("margin-left").raw);

    var _borderTop = new c.Variable(this.css("border-top").raw);
    var _borderRight = new c.Variable(this.css("border-right").raw);
    var _borderBottom = new c.Variable(this.css("border-bottom").raw);
    var _borderLeft = new c.Variable(this.css("border-left").raw);

    var _paddingTop = new c.Variable(this.css("padding-top").raw);
    var _paddingRight = new c.Variable(this.css("padding-right").raw);
    var _paddingBottom = new c.Variable(this.css("padding-bottom").raw);
    var _paddingLeft = new c.Variable(this.css("padding-left").raw);

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

    // Width and height are the result of:
    //  w = right - left;
    //  h = bottom - top;
    constrain(
      eq(c.Minus(ref.border._right, ref.border._left),
        _width,
        required
      ),
      eq(c.Minus(ref.border._bottom, ref.border._top),
        _height,
        required
      )
    );

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

    [ _marginTop, _marginRight, _marginBottom, _marginLeft,
      _paddingTop, _paddingRight, _paddingBottom, _paddingLeft
    ].forEach(function(v) { constrain(eq(v, 0, weak)); });

    [ _borderTop, _borderRight, _borderBottom, _borderLeft
    ].forEach(function(v) { constrain(eq(v, _mediumWidth, weak)); }); 


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

    // RENDER DEBUGGING ONLY:
    /*
    constrain(
      eq(_minWidth, 10, strong),
      eq(_minHeight, 30, strong)
    );
    */

    constrain(
      geq(_width, _minWidth, required),
      geq(_height, _minHeight, required)
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
  },
});

var Block = c.inherit({
  extends: RenderBox, // TODO: Block, 
  _className: "Block",
  initialize: function(node, cb){
    RenderBox.call(this, node, cb);
    cb.addBlock(this);
    this._hasBlocks = false;
    this._hasInlines = false;
  },
  addBlock: function(b) {
    if (b == this) { return; }
    console.log("block:", this.node.tagName, "got block", b.node);
  },
  addInline: function(i) {
    console.log("block:", this.node.tagName, "got inline", i.node);
    // TODO(slightlyoff): anonymous box generation!
  },
});

var Viewport = c.inherit({
  extends: Block, // TODO: Block, 
  _className: "Viewport", // for toString()
  initialize: function(width, height, node){
    // Viewport:
    //  The item that everything else is realtive to. It takes a source node
    //  whose dimensions it copies, setting margin/padding/border to zero.
    this.solver = new c.SimplexSolver();
    Block.call(this, node, this);
    FlowRoot.call(this);
    //TODO: Block.call(this, node);
    this.naturalSize = new MeasuredBox(0, 0, width, height);
    this.containingBlock = this;
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


var Inline = c.inherit({
  extends: RenderBox,
  _className: "Inline", // for toString()
  initialize: function(node, cb){
    RenderBox.call(this, node, cb);
    cb.addInline(this);
  },
  /*
  follow: function() {
    // Called once our container's width is determined. We assume our previous
    // sibling has been placed. If no sibling, we root ourselves at our
    // container's 0,0 position.
    var ref = this.edges.ref;
    var actual = this.edges.actual;
    var solver = this.solver;
    var containing = this.containingBlock.edges.actual;
    var constrain = solver.add.bind(solver);

    if(this.prev) {
      var prev = this.prev.edges.actual;
      constrain(
        eq(actual.content._top, prev.content._top, strong),
        eq(actual.content._left, prev.content._right, strong)
      );
    } else {
      console.log("no prev!");
    }

    // constrain(
    //   geq(containing.content._right, actual.content._right, strong),
    //   geq(containing.content._top,   actual.content._bottom, strong)
    // );
  },
  newLine: function() {
  },
  */
});

var TextBox = c.inherit({
  extends: Inline,
  _className: "TextBox", // for toString()
  initialize: function(node, cb){
    this.text = node.nodeValue;
    Inline.call(this, node, cb);
    this.edges.ref = null; // We deal only in actual values.
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

    var actual = this.edges.actual;
    var solver = this.solver;
    var constrain = solver.add.bind(solver);
    var containing = this.containingBlock.edges.actual;

    var _width = new c.Variable();
    var _height = new c.Variable();

    constrain(eq(_width, this.naturalSize.width, medium));
    constrain(eq(_height, this.naturalSize.height, medium));

    constrain(
      eq(c.Plus(actual.content._left, _width), actual.content._right, required),
      eq(c.Plus(actual.content._top, _height), actual.content._bottom, required)
    );

  },
});

//////////////////////////////////////////////////////
//  Workhorse functions
//////////////////////////////////////////////////////

var findBoxGenerators = function(element) {
  var doc = element.ownerDocument || document;
  var global = doc.defaultView || scope;
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
      visibleNodes = findBoxGenerators(d.documentElement);

  // console.log(visibleNodes);

  var viewportNode = document.getElementById(id);
  var dde = d.documentElement;
  var v = new Viewport(viewportNode.clientWidth, viewportNode.clientHeight, dde);

  var nodeToBoxMap = new Map();
  nodeToBoxMap.set(dde, v);

  // Run through the visible nodes, creating box types as needed and setting
  // forward/back/ref references.

  // The most recent document-ordered element that is not absolute, fixed, or float
  var prev = null;
  var containing = v;

  // var containingNode = dde;
  // var containingStack = [{ box: v, node: containingNode }];

  var boxes = [];
  var flowRoots = [];
  var solver = v.solver;
  var defaultBlockProgression = "tb";

  // solver.autoSolve = false;

  var getContainingBlock = function(n) {
    // Everything has a containing block. CSS 3 says:
    //
    //      "The containing block of other boxes is the rectangle formed by the
    //      content edge of their nearest ancestor box that is block-level.
    //      This may be an anonymous box. The ‘direction’ and
    //      ‘block-progression’ of the containing block are those of the box
    //      whose content edge it is."
    //
    // Since we've visiting in document order, we can simply look up through
    // our ancestors to see which one is block, else our containing block is
    // the viewport.

    // Positioned elements need positioned parents!
    var pn = n.parentNode;

    if (isFixed(n)) {
      // Fixed elements are always relative to the viewport.
      pn = dde;
    } else {
      if (!isPositioned(n)) {
        while (pn && pn != dde && !isBlock(pn)) {
          pn = pn.parentNode;
        }
      } else {
        // console.log("looking for a positioned parent for:", n);
        while (pn && pn != dde && !(isBlock(pn) && isPositioned(pn))) {
          pn = pn.parentNode;
        }
        // console.log("found:", pn);
      }
    }

    if (!pn) { pn = dde; }
    return nodeToBoxMap.get(pn);
  };

  var getFlowRoot = function(n) {
    var pn = n.parentNode;
    while (pn && pn != dde && !nodeToBoxMap.get(pn).flowRoot) {
      pn = pn.parentNode;
    }
    if (!pn) { pn = dde; }
    return nodeToBoxMap.get(pn);
  };

  visibleNodes.forEach(function(node) {
    var parentBox = nodeToBoxMap.get(node.parentNode);

    var cb = getContainingBlock(node);

    // console.log("containingBlock:", cb.node, "for node:", node);

    // Boxes in CSS always ahve "containing blocks". Boxes that are in a flow
    // also have "flow roots".
    if (isElement(node)) {
      // console.log("isBlock:", isBlock(node), "isInline:", isInline(node), node);
      // console.log("containgBlock node:", getContainingBlock(node).node);

      // TODO(slightlyoff): implement run-in detection
      var b;
      if (isBlock(node)) {
        b = new Block(node, cb);
      }
      if (isInline(node)) {
        b = new Inline(node, cb);
      }

      if (isInFlow(node)) {
        getFlowRoot(node).flowBoxes.push(b);
      }
      nodeToBoxMap.set(node, b);
      boxes.push(b);
      if (b.flowRoot) {
        flowRoots.push(b);
      }
      prev = b;

    } else {
      // We're a text node, so create text blocks for the constituent words and
      // add them to our container's inlines list.
 
      //  Could *really* do with access to these right about now:
      //   http://msdn.microsoft.com/en-us/library/windows/desktop/dd319118(v=vs.85).aspx
      //   http://developer.apple.com/library/mac/#documentation/Carbon/Reference/CTLineRef/Reference/reference.html
      var head = node;
      var tail = null;
      var pn = node.parentNode;
      var cs = g.getComputedStyle(pn);
      node.nodeValue.split(/\s+/).forEach(function(word) {
        if (!word) { return; }
        // Next, find the index of the current word in our remaining node,
        // split on the word end, and create LineBox items for the newly
        // split-off head element.
        var hnv = head.nodeValue;
        if (hnv.indexOf(word) >= 0) {
          tail = head.splitText(hnv.indexOf(word)+word.length);
          var b = new TextBox(head, cb)
          nodeToBoxMap.set(head, b);
          boxes.push(b);
          prev = b;
        }
        head = tail;
      });
    }

    /*
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
        nodeToBoxMap.set(node, b);
        boxes.push(b);
        // FIXME(slightlyoff):
        //      If our pos isn't the default, we are the new "containing" for
        //      children.
        return;
      case 3: // TextNode

        // FIXME: need to find some way to linearize the following if/else that
        // we need for inline-level boxes:
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

        var head = node;
        var tail = null;
        var pn = node.parentNode;
        var cs = g.getComputedStyle(pn);
        node.nodeValue.split(/\s+/).forEach(function(word) {
          if (!word) { return; }
          // Next, find the index of the current word in our remaining node,
          // split on the word end, and create LineBox items for the newly
          // split-off head element.
          var hnv = head.nodeValue;
          if (hnv.indexOf(word) >= 0) {
            tail = head.splitText(hnv.indexOf(word)+word.length);
            var b = new TextBox(containing, prev, head.nodeValue, cs, head)
            nodeToBoxMap.set(head, b);
            boxes.push(b);
            prev = b;
            // console.log("'"+head.nodeValue+"'");
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
    */
  });

  // Add the viewport to the list.
  boxes.unshift(v);
  flowRoots.unshift(v);

  // FIXME(slightlyoff):
  //    Add anonymous boxe parents here for text children of flow roots with
  //    other block children.

  // Generate our generic box constraints.
  boxes.forEach(function(box) {
    box.generate();
  });


  flowRoots.forEach(function(root) {
    console.log("flowing root:", root+"");
    root.flow();
  });

  // Generate constraints to resolve widths.

  // solver.resolve();

  // Text layout pass. Once our widths have all been determined, we place each
  // text segment and do wrapping. Once we've
  // solved for flowed blocks, we update our container's height to fit and
  // re-solve the entire system. We only call for painting once this has been
  // done everywhere.
  //
  boxes.forEach(function(box) {
  });

  // TODO(slightlyoff): sort boxes into stacking contexts for rendering!
  //                    See CSS 2.1 section E.2 for details.

  // boxes.forEach(function(box) { console.log(box+""); });

  boxesCallback(boxes);
};

scope.generateFor = function(id, boxesCallback) {
  ready(function() { _generateFor(id, boxesCallback) }, id);
};

})(this);
