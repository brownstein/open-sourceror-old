const Interpreter = require("js-interpreter");
const patchJSInterpreter = require("./async-js-interpreter-patch");
const transpileAndGetASTAndMapping = require("./get-ast-and-transpiled-code");
const hookIntoInterpreter = require("./script-runtime-hooks");

// monkey-patch in support for queueCall
patchJSInterpreter(Interpreter);

const {
  convertScriptToSlices,
  runLayout
} = require("./dist");

class ScriptRunner {
  constructor ({
    interpreter,
    slicesByPosition,
    destToSrcMap,
    mainSlice
  }) {
    this.interpreter = interpreter;
    this.slicesByPosition = slicesByPosition;
    this.destToSrcMap = destToSrcMap;
    this.mainSlice = mainSlice;
  }
  hasNextStep () {
    return !!this.interpreter.stateStack.length;
  }
  doNextStep () {
    return this.interpreter.step();
  }
  getCurrentSlice () {
    const node = this.interpreter.stateStack[this.interpreter.stateStack.length - 1].node;
    const destNodeKey = `${node.start}:${node.end}`;
    const srcNodeKey = this.destToSrcMap[destNodeKey];
    const sliceByKey = this.slicesByPosition[srcNodeKey];
    return sliceByKey || null;
  }
  getMainSlice () {
    return this.mainSlice;
  }
}

async function createScriptRunner (script) {
  const [ transpiled, ast, destToSrcMap ] = await transpileAndGetASTAndMapping(script);
  const [ctx, mainSlice] = convertScriptToSlices(ast);
  runLayout(mainSlice);

  const interpreter = new Interpreter(transpiled, (interpreter, scope) => {
    // add functions found in player-script.js
    hookIntoInterpreter(interpreter, scope);
  });

  const acorn = require("acorn");
  const fs = require("fs");

  const promisePolyfill = fs.readFileSync("./electron/promise-polyfill.js");

  const _ast = interpreter.ast;
  const _stateStack = interpreter.stateStack;
  interpreter.ast = acorn.parse(promisePolyfill, Interpreter.PARSE_OPTIONS);
  interpreter.stripLocations_(interpreter.ast, undefined, undefined);
  interpreter.stateStack = [{
    node: interpreter.ast,
    scope: interpreter.global,
    thisExpression: interpreter.global,
    done: false
  }];
  interpreter.run();
  interpreter.value = interpreter.UNDEFINED;
  interpreter.ast = _ast;
  interpreter.stateStack = _stateStack;

  return new ScriptRunner({
    interpreter,
    slicesByPosition: ctx.slicesByPosition,
    destToSrcMap,
    mainSlice
  });
}

module.exports = {
  createScriptRunner
};
