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
    default:
      break;
  }

  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  // console.log(width, color)
  ctx.lineCap = lineCap;


  var dashRemainder = 0;
  var point = points.shift();
  var x = point.x;
  var y = point.y;
  ctx.moveTo(x, y);
  points.push(point);
  points.forEach(function(point) {
    var xd = point.x;
    var yd = point.y;
    var distance = Math.sqrt(Math.pow(xd - x, 2) + Math.pow(yd - y, 2));
    // console.log(x, y, xd, yd, distance);
    // FIXME(slightlyoff): alternate path/space to respect line style!
    ctx.lineTo(xd, yd);
    x = xd;
    y = yd;
  });

  ctx.stroke();
  ctx.closePath();
  ctx.restore();
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
    /*
    b = {
      left: 100,
      right: 200,
      top: 100,
      bottom: 200
    };
    */
    pathWithStyle(
        ctx,
        // FIXME(slightlyoff): add params for border/outline radius
        [ { x: b.left - how, 
            y: b.top - how },
          { x: b.right + how, 
            y: b.top - how },
          { x: b.right + how, 
            y: b.bottom + how },
          { x: b.left - how, 
            y: b.bottom + how } ],
        box.css("outline-color"),
        2,
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
};

var paintText = function(box, ctx) {
  var c = box.edges.actual.content;
  ctx.font = box.css("font-size") + " " + box.css("font-family");
  // ctx.strokeText(box.text, c.left, c.top);
  // console.log(box.css("color").raw);
  ctx.fillStyle = box.css("color").raw;
  var y = c.top + box.css("line-height").px;
  // console.log("line-height:", box.css("line-height"), "y:", y);
  ctx.fillText(box.text, c.left, y);
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
