import esprima from "esprima";
import {
  CircleSlice,
  SymbolText
} from "./lang-shapes";

function _expression (expression) {

}

function _function (funcExpression) {
  const args = funcExpression.params;
  const body = funcExpression.body;

}

function _callExpression (callExpression) {
  let callee = callExpression.callee.name;
  switch (callee) {
    case "on":
      const symbol = callExpression.argumnets[0].name;
      const handler = callExpression.arguments[1];
      return [symbol, _function(handler)];
    default:
      return;
  }
}

export function scriptToCircle (script) {
  const statements = [];
  script.body.forEach (part => {
    if (part.type !== "ExpressionStatement") {
      return;
    }
    if (part.expression.value === "use strict") {
      return;
    }
    switch (part.expression.type) {
      case "CallExpression":
        statements.push(_callExpression(part.expression));
        return;
    }
  });
}
