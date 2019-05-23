"use strict";
const acorn = require("acorn");
const babel = require("@babel/core");
const ASTLocationMap = require("./ast-location-map");
const SourceMapMap = require("./source-map-map");

/**
 * Transpiles a given script with babel
 */
function _transpileAndCreateSourcemap (sourceScript) {
  return new Promise((resolve, reject) => {
    babel.transform(
      sourceScript,
      {
        plugins: [],
        presets: ["@babel/preset-env"],
        ast: true,
        generatorOpts: {
          sourceMaps: true
        }
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        const sm = new SourceMapMap(result.map);
        resolve([result.ast, result.code, sm]);
      }
    );
  });
}

/**
 * Recursively gets all nodes in a given AST
 */
function _getAllASTNodes (ast, nodes = []) {
  if (Array.isArray(ast)) {
    ast.forEach(n => _getAllASTNodes(n, nodes));
    return nodes;
  }
  if (!ast || !ast.type) {
    return nodes;
  }
  nodes.push(ast);
  Object.keys(ast).forEach(key => _getAllASTNodes(ast[key], nodes));
  return nodes;
}

/**
 * Gets a raw AST, a transpiled AST, and a mapping between them
 */
async function transpileAndGetASTAndMapping (rawScript) {
  const [rawAST, transpiled, sm] = await _transpileAndCreateSourcemap(rawScript);
  const transpiledAST = acorn.parse(transpiled, { locations: true });
  const rawASTNodes = _getAllASTNodes(rawAST);
  const transpiledASTNodes = _getAllASTNodes(transpiledAST);
  const rawASTLocationMap = new ASTLocationMap();
  rawASTNodes.forEach(node => rawASTLocationMap.addASTNode(node));
  const destKeysToSourceKeys = {};
  transpiledASTNodes.forEach(n => {
    const transpiledStartLoc = n.loc.start;
    const rawASTLoc = sm.getSourceLocation(transpiledStartLoc);
    const matchedSourceNode = rawASTLocationMap.getMatchingNode(
      n,
      rawASTLoc.line,
      rawASTLoc.column
    );
    const destKey = `${n.start}:${n.end}`;
    const sourceKey = `${matchedSourceNode.start}:${matchedSourceNode.end}`;
    destKeysToSourceKeys[destKey] = sourceKey;
  });
  return [
    transpiled,
    rawAST,
    destKeysToSourceKeys
  ];
}

module.exports = transpileAndGetASTAndMapping;
