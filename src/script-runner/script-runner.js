import Interpreter from "js-interpreter";

import transpileScript from "./transpiler";

/**
 * Script execution container - runs code and shows what's running when
 */
class ScriptRunner {
  constructor(scriptSrc) {
    this.transpiledScript = null;
    this.sourceAST = null;
    this.transpilationMap = null;

    this.interpreter = null;

    this.ready = false;
    this.readyPromise = this._init(srcScript);
  }
  /**
   * Internal asynchronous constructor extension
   */
  async _init(srcScript) {
    const [script, ast, transpilationMap] = await transpileScript(srcSrcipt);
    this.transpiledScript = script;
    this.sourceAST = ast;
    this.transpilationMap = transpilationMap;

    this.interpreter = new Interpreter(script, (interpreter, scope) => {
      // initialization callback here
    });

    this.ready = true;
  }
  /**
   * Check whether there's (currently) anything left to execute in the script
   */
  hasNextStep() {
    return !!this.interpreter.stateStack.length;
  }
  /**
   * Runs a single operation in the script
   */
  doNextStep() {
    return this.interpreter.step();
  }
  /**
   * Get the currently executing program section
   * @returns [start index, end index]
   */
  getExecutingSection() {
    const stateStackIndex = this.interpreter.stateStack.length - 1;
    const exNode = this.interpreter.stateStack[stateStackIndex].node;
    return this.transpilationMap.getSourceLocation(exNode.start, exNode.end);
  }
}
