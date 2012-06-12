/**
 * Copyright (C) 2012, Alex Russell (slightlyoff@chromium.org)
 * Use of this source code is governed by the LGPL, which can be found in the
 * COPYING.LGPL file.
 */

(function(scope) {
"use strict";

var pathWithStyle = function(ctx, points, color, width, style) {
  var dashLength = 5,
      spaceLength = 0,
      lineCap = "butt",
      color = color || "black",
      width = width || 2;

  switch (style) {
    case "dashed":
      dashLength = 5;
      spaceLength = 3;
      break;
    case "dotted":
      dashLength = defaultDashLength;
      spaceLength = defaultspaceLength;
      lineCap = "round";
      break;
    case "solid":
      lineCap = "square";
    default:
      break;
  }

  // ctx.save();
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = lineCap;


  var dashRemainder = 0;
  var point = points.shift();
  var x = point.x;
  var y = point.y;
  // console.log("moveTo:", x, y);
  ctx.moveTo(x, y);
  points.push(point);
  points.forEach(function(point) {
    var xd = point.x;
    var yd = point.y;
    // console.log("moveTo:", xd, yd);
    var distance = Math.sqrt(Math.pow(xd - x, 2) + Math.pow(yd - y, 2));
    // console.log(x, y, xd, yd, distance);
    // FIXME(slightlyoff): alternate path/space to respect line style!
    ctx.lineTo(xd, yd);
    x = xd;
    y = yd;
  });

  ctx.stroke();
  ctx.closePath();
  // ctx.restore();
};

var paintOutline = function(box, ctx) {
  var b = box.edges.actual.border;
  // console.log("paintOutline:", box.toString());
  var ow = parseInt(box.css("outline-width").px);
  var how = ow/2;

  if (box.css("outline-style") != "none") {
    // console.log("outline:", box.css("outline-width"), box.css("outline-style"), box.css("outline-color"));
    pathWithStyle(
        ctx,
        [ { x: b.left - how, 
            y: b.top - how },
          { x: b.right + how, 
            y: b.top - how },
          { x: b.right + how, 
            y: b.bottom + how },
          { x: b.left - how, 
            y: b.bottom + how } ],
        box.css("outline-color"),
        ow,
        "solid"
    );
  }

  if (scope.renderDebug) {
    pathWithStyle(
        ctx,
        [ { x: b.left, y: b.top},
          { x: b.right, y: b.top},
          { x: b.right, y: b.bottom},
          { x: b.left, y: b.bottom} ],
        "gray", // box.css("outline-color"),
        1,
        "solid"
    );
  }
};

var paintBackground = function(box, ctx) {
  var b = box.edges.actual.border;
  ctx.moveTo(b.left, b.top);

  // console.log(box.css("background-color").raw);
  ctx.fillStyle = box.css("background-color").raw;
  ctx.fillRect(b.left, b.top, b.width, b.height);

  // console.log("background:", ctx.fillStyle, b.left, b.top, b.width, b.height);

  // FIXME: need to paint background images!

  // FIXME: need to paint background gradients.
  
  // FIXME: need to respect border clipping (rounded corners, etc.) here.
};

var paintBorder = function(box, ctx) {
  var b = box.edges.actual.border;
  if (box.css("border-style") != "none") {
    console.log("border:", box.css("border-width").px, box.css("border-style").raw, box.css("border-color").raw);
    var btw = box.css("border-top-width").px;
    var top = b.top + btw/2;
    var brw = box.css("border-right-width").px;
    var right = b.right - brw / 2;
    var bbw = box.css("border-bottom-width").px;
    var bottom = b.bottom - bbw / 2;
    var blw = box.css("border-left-width").px;
    var left = b.left + blw / 2;
    console.log(b.top, btw);
    pathWithStyle(
        ctx,
        [
          { x: left, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ],
        box.css("border-color").raw,
        box.css("border-width").px,
        box.css("border-style")
    );
  }
};

var paintText = function(box, ctx) {
  var o = box.edges.actual.outer;
  ctx.font = box.css("font-size").raw + " " + box.value("font-family").raw;
  // ctx.strokeText(box.text, c.left, c.top);
  // console.log(box.css("color").raw);
  ctx.fillStyle = box.value("color").raw;
  // var y = c.top + box.css("line-height").px;
  // console.log("line-height:", box.css("line-height"), "y:", y);
  ctx.textBaseline = "top",
  ctx.fillText(box.text, o.left, o.top);
  /*
  var i = box.edges.actual.inner;
  console.log(o.top,
              o.right,
              o.bottom,
              o.left,
              "width:", o.width,
              "height:", o.height,
              box.text);

  console.log(i.top,
              i.right,
              i.bottom,
              i.left,
              i.width,
              i.height,
              box.text);
  */

  if (scope.renderDebug) {
    pathWithStyle(
        ctx,
        [
          { x: o.left,  y: o.top },
          { x: o.right, y: o.top },
          { x: o.right, y: o.bottom },
          { x: o.left,  y: o.bottom },
          { x: o.left,  y: o.top },
        ],
        "rgba(173,173,173,0.7)",
        1,
        "solid"
    );
  }
};

scope.renderTo = function(id, boxes) {
  var ctx = document.getElementById(id).getContext("2d");
  boxes.forEach(function(box) {
    // Paint each item. See CSS 2.1 section E.2 for details.
    if (box.text) {
      paintText(box, ctx);
      paintOutline(box, ctx);
    } else {
      paintBackground(box, ctx);
      paintBorder(box, ctx);
      // ...
      paintOutline(box, ctx);
    }

    // FIXME(slightlyoff): Do the other 11 paint steps!
  });
};

})(this);
