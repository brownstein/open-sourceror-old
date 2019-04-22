import esprima from "esprima";
import {
  runLayout,
  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice
} from "./text-circles";

const typesOfThings = {
  Program: script => ({
      expand: script.body,
      andThen: slices => {
        const csg = new CircleGroupSlice(slices);
        csg.runLayout();
        return csg;
      }
  }),
  ExpressionStatement: expStatement => ({
    expand: expStatement.expression
  }),
  Literal: l => ({
    value: new CircleTextSlice(`${l.value}`)
  }),
  CallExpression: exp => ({
    expand: [exp.callee, ...(exp.arguments || [])],
    andThen: slices => [
      new CircleStackSlice([
        new CircleGroupSlice([
          slices[0]
        ]),
        slices.length > 1 ?
          new CircleGroupSlice(slices.slice(1, slices.length)) :
          null
      ])
    ]
  }),
  Identifier: i => ({
    value: new CircleTextSlice(i.name)
  }),
  ArrowFunctionExpression: f => ({
    expand: [...f.params, f.body],
    andThen: slices => new CircleGroupSlice(slices)
  }),
  FunctionDeclaration: f => ({
    expand: [...(f.params||[]), f.body],
    andThen: slices => [
      new CircleStackSlice([
        new CircleGroupSlice([
          new CircleTextSlice(`${f.id.name}()`)
        ]),
        new CircleGroupSlice(slices)
      ])
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
    ],
    andThen: dec => [
      dec[0],
      new CircleTextSlice("<-"),
      ...dec.slice(1)
    ]
  }),
  AssignmentExpression: a => ({
    expand: [
      a.left,
      a.right
    ],
    andThen: dec => [
      dec[0],
      new CircleTextSlice("<-"),
      ...dec.slice(1)
    ]
  }),
  MemberExpression: m => ({
    expand: [m.object, m.property]
  }),
  NewExpression: n => ({
    expand: [n.callee, ...n.arguments],
    andThen: slices => new CircleGroupSlice(slices)
  }),
  UnaryExpression: u => ({
    value: new CircleTextSlice(u.operator),
    expand: [u.argument]
  }),
  IfStatement: (i, ctx) => {
    const test = _entityToSlices(ctx, i.test);
    const consequent = _entityToSlices(ctx, i.consequent);
    return {
      value: new CircleStackSlice([
        new CircleTextSlice("IF:"),
        ...test,
        new CircleTextSlice("---"),
        ...consequent
      ])
    };
  },
  LogicalExpression: exp => ({
    expand: [exp.left, exp.right],
    andThen: leftAndRight => new CircleGroupSlice([
      leftAndRight[0],
      new CircleTextSlice(exp.operator),
      leftAndRight[1]
    ])
  }),
  BinaryExpression: exp => ({
    expand: [exp.left, exp.right],
    andThen: leftAndRight => new CircleGroupSlice([
      leftAndRight[0],
      new CircleTextSlice(exp.operator),
      leftAndRight[1]
    ])
  }),
  ReturnStatement: r => ({
    expand: [r.argument],
    andThen: result => [
      new CircleTextSlice("return"),
      ...result
    ]
  }),
  ObjectExpression: r => ({
    expand: r.properties,
    andThen: slices => new CircleGroupSlice(slices)
  }),
  Property: p => ({
    expand: [p.key, p.value]
  }),
  ArrayExpression: a => ({
    expand: a.elements
  }),
  ForStatement: f => ({
    expand: [
      f.init,
      f.test,
      f.update,
      f.body
    ],
    value: new CircleTextSlice("FOR"),
    andThen: res => new CircleStackSlice([
      new CircleGroupSlice(res.slice(0, 6)),
      new CircleGroupSlice(res.slice(6, res.length))
    ])
  }),
  UpdateExpression: u => ({
    expand: u.argument,
    andThen: arg => new CircleGroupSlice([
      ...arg,
      new CircleTextSlice(u.operator)
    ])
  })
};

function _ensureArray (v) {
  if (Array.isArray(v)) {
    return v;
  }
  return [v];
}

function _entityToSlices (ctx, node) {
  if (Array.isArray(node)) {
    return node.map(_entityToSlices.bind(null, ctx))
    .reduce((m, arr) => m.concat(arr), []);
  }
  if (typesOfThings[node.type]) {
    const thingHandler = typesOfThings[node.type];
    const thingHandlerResult = thingHandler(node, ctx);
    if (thingHandlerResult) {
      let ret = [];
      if (thingHandlerResult.value || thingHandlerResult.values) {
        ret.push(..._ensureArray(thingHandlerResult.value || thingHandlerResult.values));
      }
      if (thingHandlerResult.expand) {
        _ensureArray(thingHandlerResult.expand).forEach(expandSlice => {
          ret.push(..._entityToSlices(ctx, expandSlice));
        });
      }
      if (thingHandlerResult.andThen) {
        ret = _ensureArray(thingHandlerResult.andThen(ret));
      }
      ctx.slicesByPosition[`${node.start}:${node.end}`] = ret;
      return ret;
    }
  }
  return [];
}

export function scriptToCircle (script) {
  const ctx = {
    slicesByPosition: {}
  };
  return [ctx, _entityToSlices(ctx, script)];
}
