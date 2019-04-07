import esprima from "esprima";
import {
  CircleSlice,
  SymbolTextCircleSlice,
  applyCircularLayout
} from "./lang-shapes";

const typesOfThings = {
  Program: script => ({
      expand: script.body,
      andThen: slices => {
        applyCircularLayout(slices, {
          startTheta: -Math.PI * 0.5,
          endTheta: Math.PI * 1.5
        });
        return slices;
      }
  }),
  ExpressionStatement: expStatement => ({
    expand: expStatement.expression
  }),
  Literal: l => ({
    value: new SymbolTextCircleSlice({ text: `${l.value}`, runic: false })
  }),
  CallExpression: exp => ({
    expand: [exp.callee, ...exp.arguments],
    andThen: slices => [
      slices[0],
      new CircleSlice({ children: slices.slice(1, slices.length) })
    ]
  }),
  Identifier: i => ({
    value: new SymbolTextCircleSlice({ text: i.name, runic: false })
  }),
  ArrowFunctionExpression: f => ({
    expand: [...f.params, f.body],
    andThen: slices => new CircleSlice({ children: slices })
  }),
  FunctionDeclaration: f => ({
    expand: [...f.params, f.body],
    andThen: slices => [
      new SymbolTextCircleSlice({ text: "F(" }),
      new SymbolTextCircleSlice({ text: f.id.name, runic: false }),
      new SymbolTextCircleSlice({ text: "):" }),
      new CircleSlice({ children: slices })
    ]
  }),
  BlockStatement: b => ({
    expand: b.body
  }),
  VariableDeclaration: v => ({
    expand: v.declarations
  }),
  VariableDeclarator: v => ({
    expand: [
      v.id,
      v.init,
    ]
  }),
  AssignmentExpression: a => ({
    expand: [
      a.left,
      a.right
    ]
  }),
  MemberExpression: m => ({
    expand: [m.object, m.property]
  }),
  NewExpression: n => ({
    expand: [n.callee, ...n.arguments],
    andThen: slices => new CircleSlice({ children: slices })
  }),
  UnaryExpression: u => ({
    value: new SymbolTextCircleSlice({ text: u.operator }),
    expand: [u.argument]
  }),
  IfStatement: i => ({
    expand: [i.test, i.consequent],
    andThen: slices => new CircleSlice({ children: slices })
  }),
  ReturnStatement: r => ({
    expand: [r.argument]
  }),
  ObjectExpression: r => ({
    expand: r.properties,
    andThen: slices => new CircleSlice({ children: slices })
  }),
  Property: p => ({
    expand: [p.key, p.value]
  }),
  ArrayExpression: a => ({
    expand: a.elements
  })
};

function _ensureArray (v) {
  if (Array.isArray(v)) {
    return v;
  }
  return [v];
}

function _entityToSlices (node) {
  if (Array.isArray(node)) {
    return node.map(_entityToSlices).reduce((m, arr) => m.concat(arr), []);
  }
  if (typesOfThings[node.type]) {
    const thingHandler = typesOfThings[node.type];
    const thingHandlerResult = thingHandler(node);
    if (thingHandlerResult) {
      let ret = [];
      if (thingHandlerResult.value || thingHandlerResult.values) {
        ret.push(..._ensureArray(thingHandlerResult.value || thingHandlerResult.values));
      }
      if (thingHandlerResult.expand) {
        _ensureArray(thingHandlerResult.expand).forEach(expandSlice => {
          ret.push(..._entityToSlices(expandSlice));
        });
      }
      if (thingHandlerResult.andThen) {
        ret = _ensureArray(thingHandlerResult.andThen(ret));
      }
      return ret;
    }
  }
  return [];
}

export function scriptToCircle (script) {
  return _entityToSlices(script);
}
