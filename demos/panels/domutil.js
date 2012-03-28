(function(scope) {
"use strict";

scope.$$ = function(query, opt_contextElement) {
  if (!query)
    return [];

  var contextNode = opt_contextElement || document;
  var isDoc = contextNode.nodeType == Node.DOCUMENT_NODE;
  var doc = isDoc ? contextNode : contextNode.ownerDocument;

  // Rewrite the query to be ID rooted.
  if (!isDoc) {
    if (!contextNode.hasAttribute('id'))
      contextNode.id = 'unique' + query.counter_++;
    query = '#' + contextNode.id + ' ' + query;
  }

  var rv = doc.querySelectorAll(query);
  rv.__proto__ = Array.prototype;
  return rv;
}

scope.$$.counter_ = 0;

scope.$ = function(query, opt_contextElement) {
  return $$(query, opt_contextElement)[0];
}

// requestAnimationFrame shimming.
scope.rAF = window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(callback) {
            window.setTimeout(callback, 1000 / 60);
          };

var tagMap = new Map();
var tagList = [];

var upTo = function(type) {
  var up = type.prototype.upgrade;
  return function(el) {
    if (!(el instanceof type) && up) {
      up(el);
      if (el.parentNode) { el.attach(); }
    }
  };
};

scope.HTMLElement.register = function(type) {
  var tn = type.tagName || type.prototype.tagName; 
  var upgrade = upTo(type);

  tagMap.set(tn, type);
  tagList.push(tn);

  var ms = new MutationSummary({
    callback: function(summaries) {
      var s = summaries[0];
      s.added.forEach(upgrade);
    },
    queries: [{ element: tn }]
  });
};

scope.addEventListener("load", function() {
  // SUPER hackey. Since we don't seem to be able to locate elements as
  // they're created by the initial parse, look for them on startup and
  // run the upgrade if we need to.
  tagList.forEach(function(tn) {
    var elements = document.querySelectorAll(tn);
    Array.prototype.slice.call(elements).forEach(upTo(tagMap.get(tn)));
  });
}, false);

})(window);
