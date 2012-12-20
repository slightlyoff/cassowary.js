// Adapted from
//    http://divergentcoder.com/ToyLang/Grammar.pegjs
//  and:
//    https://github.com/dmajda/pegjs/blob/master/examples/javascript.pegjs

start
  = Statement+

// Separator, Space
Zs = [\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]

SourceCharacter
  = .

IdentifierStart
  = [a-zA-Z]
  / "$"
  / "_"

WhiteSpace "whitespace"
  = [\t\v\f \u00A0\uFEFF]
  / Zs

LineTerminator
  = [\n\r\u2028\u2029]

LineTerminatorSequence "end of line"
  = "\n"
  / "\r\n"
  / "\r"
  / "\u2028" // line separator
  / "\u2029" // paragraph separator

Comment "comment"
  = MultiLineComment
  / SingleLineComment

MultiLineComment
  = "/*" (!"*/" SourceCharacter)* "*/"

MultiLineCommentNoLineTerminator
  = "/*" (!("*/" / LineTerminator) SourceCharacter)* "*/"

SingleLineComment
  = "//" (!LineTerminator SourceCharacter)*
_
  = (WhiteSpace / MultiLineCommentNoLineTerminator / SingleLineComment)*

__
  = (WhiteSpace / LineTerminatorSequence / Comment)*

Literal
  = val:(Real / Integer) {
    return {
      type: "NumericLiteral",
      value: val
    }
  }

Integer
  = digits:[0-9]+ {
    return parseInt(digits.join(""));
  }

Real
  = digits:(Integer "." Integer) {
    return parseFloat(digits.join(""));
  }

SignedInteger
  = [-+]? [0-9]+

Identifier "identifier"
  = name:IdentifierName { return name; }

IdentifierName "identifier"
  = start:IdentifierStart parts:IdentifierStart* {
      return start + parts.join("");
    }

PrimaryExpression
  = name:Identifier { return { type: "Variable", name: name }; }
  / Literal
  / "(" __ expression:LinearExpression __ ")" { return expression; }

UnaryExpression
  = PrimaryExpression
  / operator:UnaryOperator __ expression:UnaryExpression {
      return {
        type:       "UnaryExpression",
        operator:   operator,
        expression: expression
      };
    }

UnaryOperator
  = "+"
  / "-"
  /  "!"

MultiplicativeExpression
  = head:UnaryExpression
    tail:(__ MultiplicativeOperator __ UnaryExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

MultiplicativeOperator
  = operator:("*" / "/" / "%") !"=" { return operator; }

AdditiveExpression
  = head:MultiplicativeExpression
    tail:(__ AdditiveOperator __ MultiplicativeExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

AdditiveOperator
  = "+" / "-"

InequalityExpression
  = head:AdditiveExpression
    tail:(__ InequalityOperator __ AdditiveExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

InequalityOperator
  = "<="
  / ">="
  / "<"
  / ">"

LinearExpression
  = head:InequalityExpression
    tail:(__ EqualityOperator __ InequalityExpression)* {
      var result = head;
      for (var i = 0; i < tail.length; i++) {
        result = {
          type:     "BinaryExpression",
          operator: tail[i][1],
          left:     result,
          right:    tail[i][3]
        };
      }
      return result;
    }

EqualityOperator
  = "=="
  / "!=="

Statement
  = LinearExpression
