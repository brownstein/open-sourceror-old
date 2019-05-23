import {
  runLayout,
  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice
} from "./text-circles";

const bindEntityExpansions = expand => ({
  File: f => expand(f.program),
  Program: script => {
    const body = new CircleGroupSlice(script.body.map(expand));
    return body;
  },
  ExpressionStatement: exp => expand(exp.expression),
  Literal: l => new CircleTextSlice(`${l.value}`),
  NumericLiteral: l => new CircleTextSlice(`${l.value}`),
  StringLiteral: l => new CircleTextSlice(`${l.value}`),
  CallExpression: exp => {
    const expCallee = expand(exp.callee);
    let expArguments = [new CircleTextSlice("-")];
    if (exp.arguments && exp.arguments.length) {
      expArguments = exp.arguments.map(expand);
    }
    return new CircleStackSlice([
      expCallee,
      new CircleGroupSlice(expArguments)
    ].filter(v => v));
  },
  Identifier: i => new CircleTextSlice(i.name),
  ArrowFunctionExpression: f => new CircleGroupSlice([
    ...([f.params || []].map(expand)),
    expand(f.body)
  ]),
  FunctionDeclaration: f => new CircleStackSlice([
    new CircleTextSlice(`${f.id.name}()`),
    new CircleGroupSlice([
      ...((f.params || []).map(expand)),
      expand(f.body)
    ])
  ]),
  FunctionExpression: f => new CircleStackSlice([
    new CircleTextSlice(`${f.id ? f.id.name : "F"}()`),
    new CircleGroupSlice([
      ...((f.params || []).map(expand)),
      expand(f.body)
    ])
  ]),
  BlockStatement: b => new CircleGroupSlice(b.body.map(expand)),
  VariableDeclaration: v => new CircleGroupSlice(v.declarations.map(expand)),
  VariableDeclarator: v => new CircleGroupSlice([
    expand(v.id),
    new CircleTextSlice("<-"),
    expand(v.init)
  ]),
  AssignmentExpression: a => new CircleGroupSlice([
    expand(a.left),
    new CircleTextSlice("<-"),
    expand(a.right)
  ]),
  MemberExpression: m => new CircleGroupSlice([
    expand(m.object),
    expand(m.property)
  ]),
  NewExpression: n => new CircleGroupSlice([
    expand(n.callee),
    ...(n.arguments || []).map(expand)
  ]),
  UnaryExpression: u => new CircleGroupSlice([
    new CircleTextSlice(u.operator),
    expand(u.argument)
  ]),
  IfStatement: i => new CircleStackSlice([
    new CircleGroupSlice([
      new CircleTextSlice("IF"),
      expand(i.test)
    ]),
    expand(i.consequent)
  ]),
  LogicalExpression: exp => new CircleGroupSlice([
    expand(exp.left),
    new CircleTextSlice(exp.operator),
    expand(exp.right)
  ]),
  BinaryExpression: exp => new CircleGroupSlice([
    expand(exp.left),
    new CircleTextSlice(exp.operator),
    expand(exp.right)
  ]),
  ReturnStatement: r => new CircleGroupSlice([
    new CircleTextSlice("return"),
    r.argument ? expand(r.argument) : null
  ]),
  ObjectExpression: r => new CircleGroupSlice([
    new CircleTextSlice("{"),
    ...(r.properties || []).map(expand),
    new CircleTextSlice("}")
  ]),
  Property: p => new CircleGroupSlice([
    expand(p.key),
    expand(p.value)
  ]),
  ArrayExpression: r => new CircleGroupSlice([
    new CircleTextSlice("["),
    ...(r.elements || []).map(expand),
    new CircleTextSlice("]")
  ]),
  ForStatement: f => new CircleStackSlice([
    new CircleGroupSlice([
      expand(f.init),
      expand(f.test),
      expand(f.update)
    ]),
    expand(f.body)
  ]),
  UpdateExpression: u => new CircleGroupSlice([
    expand(u.argument),
    new CircleTextSlice(u.operator)
  ]),
  TryStatement: t => expand(t.block),
  ThisExpression: t => new CircleTextSlice("this")
});

export function convertScriptToSlices (script) {
  const slicesByPosition = [];
  let entityExpansions;
  function expand (node) {
    console.log(node, node.type);
    const expandEntity = entityExpansions[node.type];
    if (expandEntity) {
      const result = expandEntity(node);
      slicesByPosition[`${node.start}:${node.end}`] = result;
      return result;
    }
    else {
      return null;
    }
  }
  entityExpansions = bindEntityExpansions(expand);
  return [{ slicesByPosition }, expand(script)];
}
