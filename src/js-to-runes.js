import esprima from "esprima";
import {
  CircleSlice,
  SymbolTextCircleSlice,
  applyCircularLayout
} from "./lang-shapes";


// symbols are just symbols
function _symbolToArc (symbol) {
  return new SymbolTextCircleSlice({
    text: symbol.name
  });
}

function _functionToArc (funcExpression) {
  const params = funcExpression.params;
  const body = funcExpression.body;
  // add container arc
  const functionArc = new CircleSlice({ thickness: 3 });
  // add variables
  params.forEach(p => {
    functionArc.children.push(_symbolToArc(p));
  });
  // add function body
  functionArc.children.push(new SymbolTextCircleSlice({ text: "=>" }));
  functionArc.children.push(..._blockStatementToArc(body));

  console.log({ params, functionArc });

  return functionArc;
}

function _callExpressionToArc (callExpression) {
  const slices = [];
  let callee = callExpression.callee.name;
  if (!callee) {
    console.log({ callExpression });
  }
  switch (callee) {
    case "on":
      const symbol = callExpression.arguments[0].name;
      slices.push(_symbolToArc(symbol));
      const handler = callExpression.arguments[1];
      slices.push(_functionToArc(handler));
      break;
    default:
      return;
  }
  const callCircle = new CircleSlice();
  callCircle.children = slices;
  return callCircle;
}

function _blockStatementToArc (block) {
  const slices = [];
  block.body.forEach (part => {
    switch (part.type) {
      case "ExpressionStatement":
        slices.push(_expressionStatementToArc(part.expression));
        break;
      default:
        break;
    }
  });
  return slices.filter(s => s);
}

function _expressionStatementToArc (expression) {
  if (expression.value === "use strict") {
    return;
  }
  switch (expression.type) {
    case "CallExpression":
      return _callExpressionToArc(expression);
    default:
      return null;
  }
}

export function scriptToCircle (script) {
  // create arc slices
  let slices = [];
  script.body.forEach (part => {
    if (part.type !== "ExpressionStatement") {
      return;
    }
    slices.push(_expressionStatementToArc(part.expression));
  });
  // remove anything empty
  slices = slices.filter(s => s);
  // make arcs concentric and balance their sizes
  applyCircularLayout(slices, {
    startTheta: -Math.PI * 0.5,
    endTheta: Math.PI * 1.5
  });
  return slices;
}
