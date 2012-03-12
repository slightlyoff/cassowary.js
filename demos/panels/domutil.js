$$ = function(query, opt_contextElement) {
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

$$.counter_ = 0;

$ = function(query, opt_contextElement) {
  return $$(query, opt_contextElement)[0];
}
