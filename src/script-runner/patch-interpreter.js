/**
 * Applies patches to the Interpreter class
 */
export default function patchInterpreter(Interpreter) {

  /**
  * Shifts the given function at the bottom of the state stack, delaying the call.
  * @param {Interpreter.Object} func Pseudo function to call.
  * @param {Interpreter.Object[]} args Arguments to provide to the function.
  */
  Interpreter.prototype.queueCall = function(func, args) {
    var state = this.stateStack[0];
    var interpreter = this;
    if (!state || state.node.type != 'Program') {
      // this used to be catestrophic - now, we just do an emergency patch
      // of the state stack
      interpreter.stateStack.push({
        node: interpreter.ast,
        scope: interpreter.global,
        thisExpression: interpreter.global,
        done: false
      });
      console.warn('Expecting original AST to start with a Program node.');
      state = this.stateStack[0];
      // throw Error('Expecting original AST to start with a Program node.');
    }
    state.done = false;
    var scope = this.createScope(func.node.body, func.parentScope);
    func.node.params.forEach(function(p, i) {
      interpreter.setProperty(
        scope,
        interpreter.createPrimitive(p.name),
        args[i] || interpreter.createPrimitive(undefined)
      );
    })
    var argsList = this.createObject(this.ARRAY);
    args.forEach(function(arg, i) {
      interpreter.setProperty(argsList, interpreter.createPrimitive(i), arg);
    })
    this.setProperty(scope, 'arguments', argsList);
    var last = func.node.body.body[func.node.body.body.length - 1];
    if(last && (last.type == 'ReturnStatement')) {
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
};
