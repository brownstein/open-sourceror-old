import * as acorn from "acorn";
import promisePolyfill from "./promise-polyfill.txt";

/**
 * Initialize the interpreter scope with global functions
 */
export function initializeScope(interpreter, scope) {

  // add support for console.log and 'log' shorthand
  const nativeConsole = interpreter.createObject();
  const nativeLogFunc = interpreter.createNativeFunction((...args) => {
    const nativeArgs = args.map(a => interpreter.pseudoToNative(a));
    console.log(...nativeArgs);
    // return interpreter.nativeToPseudo(undefined);
  });
  interpreter.setProperty(scope, "log", nativeLogFunc);
  interpreter.setProperty(scope, "console", nativeConsole);
  interpreter.setProperty(nativeConsole, "log", nativeLogFunc);

  // add support for setTimeout
  const nativeSetTimeout = interpreter.createNativeFunction(
    (nativeCB, nativeTimeout) => {
      const timeout = interpreter.pseudoToNative(nativeTimeout);
      setTimeout(() => interpreter.queueCall(nativeCB, []), timeout);
    }
  );
  interpreter.setProperty(scope, "setTimeout", nativeSetTimeout);

  // add support for some engine-level hooks
  const nativeOn = interpreter.createNativeFunction(
    (nativeFuncName, nativeCB) => {
      return;
    }
  );
  interpreter.setProperty(scope, "on", nativeOn);
}

/**
 * Run standard polyfulls within the interpreter
 */
export function runPolyfills (interpreter) {
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
}
