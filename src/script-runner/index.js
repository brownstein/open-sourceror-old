import Interpreter from "js-interpreter";

import transpileScript from "./transpiler";
import { initializeScope, runPolyfills } from "./runtime-hooks";
import patchInterpreter from "./patch-interpreter";

// patch the interpreter class to support queueCall
patchInterpreter(Interpreter);

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
  constructor(scriptSrc, engine, callingEntity) {
    // code
    this.transpiledScript = null;
    this.transpilationMap = null;

    // engine + caster (for interraction with game)
    this.engine = engine;
    this.callingEntity = callingEntity;

    // interpreter instance
    this.interpreter = null;

    // execution bookkeeping
    this.outstandingCallbackCount = 0;
    this.transpilationError = null;

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
    // use transpilation cache to avoid repeating expensive operations
    if (ScriptRunner._transpileCache[srcScript]) {
      [script, ast, transpilationMap] = ScriptRunner._transpileCache[srcScript];
    }
    else {
      try {
        [script, ast, transpilationMap] = await transpileScript(srcScript);
      }
      // compilation errors
      catch (err) {
        console.error(err); // err.loc is useful here
        this.transpilationError = err;
        throw err;
      }
      ScriptRunner._transpileCache[srcScript] = [script, ast, transpilationMap];
    }
    this.transpiledScript = script;
    // this.sourceAST = ast; // this turns out to be expensive to store - only
    // do so if we end up needing it for graphical representation as a spell
    this.transpilationMap = transpilationMap;

    this.interpreter = new Interpreter(script, (interpreter, scope) => {
      initializeScope(interpreter, scope, this);
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
   * Check whether the script has fully executed
   */
  hasCompletedExecution() {
    return !(this.outstandingCallbackCount > 0 || this.hasNextStep());
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
