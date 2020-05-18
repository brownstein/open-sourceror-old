import Interpreter from "js-interpreter";

import transpileScript from "./transpiler";
import { initializeScope } from "./runtime-hooks";

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

/**
 * Script execution container - runs code and shows what's running when
 */
export default class ScriptRunner {
  constructor(scriptSrc) {
    this.transpiledScript = null;
    this.sourceAST = null;
    this.transpilationMap = null;

    this.interpreter = null;

    this.ready = false;
    this.readyPromise = this._init(scriptSrc);
  }
  /**
   * Internal asynchronous constructor extension
   */
  async _init(srcScript) {
    const [script, ast, transpilationMap] = await transpileScript(srcScript);
    this.transpiledScript = script;
    this.sourceAST = ast;
    this.transpilationMap = transpilationMap;

    this.interpreter = new Interpreter(script, (interpreter, scope) => {
      initializeScope(interpreter, scope);
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
    const { start, end } = exNode;
    const srcExNode = this.transpilationMap.getSourceLocation(start, end);
    return srcExNode;
  }
}
