import esprima from "esprima";
import {
  CircleSlice,
  SymbolTextCircleSlice,
  applyCircularLayout
} from "./lang-shapes";

function _expression (expression) {

}

function _symbol (symbol) {
  return new SymbolTextCircleSlice({
    text: symbol.name
  });
}

function _function (funcExpression) {
  const params = funcExpression.params;
  const body = funcExpression.body;
  return new CircleSlice();
}

function _callExpression (callExpression) {
  let callee = callExpression.callee.name;
  const slices = [];
  switch (callee) {
    case "on":
      const symbol = callExpression.arguments[0].name;
      slices.push(_symbol(symbol));
      const handler = callExpression.arguments[1];
      slices.push(_function(handler));
      break;
    default:
      return;
  }
  const callCircle = new CircleSlice();
  callCircle.children = slices;
  return callCircle;
}

export function scriptToCircle (script) {
  const slices = [];
  script.body.forEach (part => {
    if (part.type !== "ExpressionStatement") {
      return;
    }
    if (part.expression.value === "use strict") {
      return;
    }
    switch (part.expression.type) {
      case "CallExpression":
        slices.push(_callExpression(part.expression));
        return;
    }
  });
  applyCircularLayout(slices);
  return slices;
}
