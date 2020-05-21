import Interpreter from "js-interpreter";

import transpileScript from "./transpiler";
import { initializeScope, runPolyfills } from "./runtime-hooks";

// patch the interpreter class to support queueCall

/**
* Shifts the given function at the bottom of the state stack, delaying the call.
* @param {Interpreter.Object} func Pseudo function to call.
* @param {Interpreter.Object[]} args Arguments to provide to the function.
*/
Interpreter.prototype.queueCall = function(func, args) {
  var state = this.stateStack[0];
  var interpreter = this;
  if (!state || state.node.type != 'Program') {
    throw Error('Expecting original AST to start with a Program node.');
  }
  state.done = false;
  var scope = this.createScope(func.node.body, func.parentScope);
  func.node.params.forEach(function(p, i) {
    interpreter.setProperty(scope, interpreter.createPrimitive(p.name), args[i]);
  })
  var argsList = this.createObject(this.ARRAY);
  args.forEach(function(arg, i) {
    interpreter.setProperty(argsList, interpreter.createPrimitive(i), arg);
  })
  this.setProperty(scope, 'arguments', argsList);
  var last = func.node.body.body[func.node.body.body.length - 1];
  if(last.type == 'ReturnStatement') {
    last.type = 'ExpressionStatement';
    last.expression = last.argument;
    delete last.argument;
  }
  this.stateStack.splice(1, 0, {
    node: func.node.body,
    scope: scope,
    value: this.getScope().strict ? this.UNDEFINED : this.global
  });
};
Interpreter.prototype['queueCall'] = Interpreter.prototype.queueCall;

// AST node types to ignore in line-by-line traversal
const _CONTAINER_TYPES = {
  Program: 1,
  BlockStatement: 1
};

/**
 * Script execution container - runs code and shows what's running when
 */
export default class ScriptRunner {
  static _transpileCache = {};
  constructor(scriptSrc) {
    // code
    this.transpiledScript = null;
    this.sourceAST = null;
    this.transpilationMap = null;

    // interpreter instance
    this.interpreter = null;

    // map source indices to lines
    this.scriptPositionToLine = [];
    let line = 0;
    for (let si = 0; si < scriptSrc.length; si++) {
      const char = scriptSrc[si];
      switch (char) {
        case "\n":
        case "\r":
          line++;
          break;
        default:
          break;
      }
      this.scriptPositionToLine.push(line);
    }

    // currently executing line
    this.currentLine = null;

    // readiness state and async initialization
    this.ready = false;
    this.readyPromise = this._init(scriptSrc);
  }
  /**
   * Internal asynchronous constructor extension
   */
  async _init(srcScript) {
    let script, ast, transpilationMap;
    if (ScriptRunner._transpileCache[srcScript]) {
      [script, ast, transpilationMap] = ScriptRunner._transpileCache[srcScript];
    }
    else {
      [script, ast, transpilationMap] = await transpileScript(srcScript);
      ScriptRunner._transpileCache[srcScript] = [script, ast, transpilationMap];
    }
    this.transpiledScript = script;
    this.sourceAST = ast;
    this.transpilationMap = transpilationMap;

    this.interpreter = new Interpreter(script, (interpreter, scope) => {
      initializeScope(interpreter, scope);
    });

    runPolyfills(this.interpreter);

    this.ready = true;
  }
  /**
   * Check whether there's (currently) anything left to execute in the script
   */
  hasNextStep() {
    if (!this.interpreter.stateStack.length) {
      return false;
    }
    if (this.interpreter.stateStack.length === 1) {
      const state = this.interpreter.stateStack[0];
      if (state.done) {
        return false;
      }
    }
    return true;
  }
  /**
   * Runs a single operation in the script
   */
  doNextStep() {
    // TODO: populate current line
    return this.interpreter.step();
  }
  doCurrentLine() {
    let line = this.currentLine;
    let stateStackIndex = this.interpreter.stateStack.length - 1;
    let exState = this.interpreter.stateStack[stateStackIndex];
    if (!exState || exState.done) {
      return false;
    }
    let exNode = exState.node;
    let exNodeIsContainer = _CONTAINER_TYPES[exNode.type] || false;
    let retVal = false;
    let i = 0;
    while (
      i++ < 1000 &&
      (exNodeIsContainer || line === this.currentLine)
    ) {
      retVal = this.interpreter.step();
      stateStackIndex = this.interpreter.stateStack.length - 1;
      exState = this.interpreter.stateStack[stateStackIndex];
      if (!exState || exState.done) {
        return false;
      }
      exNode = exState.node;
      exNodeIsContainer = _CONTAINER_TYPES[exNode.type] || false;
      const srcPosition = this.transpilationMap.getSourceLocation(
        exNode.start,
        exNode.end
      );
      const srcStart = srcPosition[0];
      line = srcStart && this.scriptPositionToLine[srcStart];
    }
    this.currentLine = line;
    return retVal;
  }
  /**
   * Get the currently executing program section
   * @returns [start index, end index, line number]
   */
  getExecutingSection() {
    const stateStackIndex = this.interpreter.stateStack.length - 1;
    const exNode = this.interpreter.stateStack[stateStackIndex].node;
    const { start, end } = exNode;
    const srcExNode = this.transpilationMap.getSourceLocation(start, end);
    return srcExNode;
  }
  getExecutingLine() {
    return this.currentLine;
  }
}
