import * as acorn from "acorn";

import { castToVec2 } from "p2-utils/vec2-utils";
import promisePolyfill from "./promise-polyfill.txt";

import { consoleLog } from "src/redux/actions/scripts";

import {
  getNativeFire,
  getNativeSensor,
  getNativeLaser,
  getNativePush
} from "./spells";

/**
 * Initialize the interpreter scope with global functions
 */
export function initializeScope(interpreter, scope, runner) {

  // add support for console.log and 'log' shorthand
  const nativeConsole = interpreter.createObject();
  const nativeLogFunc = interpreter.createNativeFunction((...args) => {
    const nativeArgs = args.map(a => interpreter.pseudoToNative(a));
    console.log(...nativeArgs);
    runner.engine.store.dispatch(consoleLog(...nativeArgs));
    return interpreter.nativeToPseudo(undefined);
  });
  interpreter.setProperty(scope, "log", nativeLogFunc);
  interpreter.setProperty(scope, "console", nativeConsole);
  interpreter.setProperty(nativeConsole, "log", nativeLogFunc);

  // add support for setTimeout
  const nativeSetTimeout = interpreter.createNativeFunction(
    (nativeCB, nativeTimeout) => {
      const timeout = interpreter.pseudoToNative(nativeTimeout);
      runner.outstandingCallbackCount++;
      setTimeout(() => {
        interpreter.queueCall(nativeCB, []);
        runner.outstandingCallbackCount--;
      }, timeout);
    }
  );
  interpreter.setProperty(scope, "setTimeout", nativeSetTimeout);

  // add support for some engine-level hooks
  const nativeOn = interpreter.createNativeFunction(
    (nativeFuncName, nativeCB) => {
      return interpreter.nativeToPseudo(undefined);
    }
  );
  interpreter.setProperty(scope, "on", nativeOn);

  // add support for native requirement of spells
  // TODO: figure out a system for custom spells to require each other
  const nativeRequireCache = {};
  const nativeRequire = interpreter.createNativeFunction(
    rawModuleName => {
      const moduleName = interpreter.pseudoToNative(rawModuleName);
      if (nativeRequireCache[moduleName]) {
        return nativeRequireCache[moduleName];
      }
      let requirement = null;
      switch (moduleName) {
        case "fire":
          requirement = getNativeFire(interpreter, scope, runner);
          break;
        case "sensor":
          requirement = getNativeSensor(interpreter, scope, runner);
          break;
        case "laser":
          requirement = getNativeLaser(interpreter, scope, runner);
          break;
        case "push":
          requirement = getNativePush(interpreter, scope, runner);
          break;
        default:
          throw new Error("Unknown module - have you tried getting gud?");
      }
      nativeRequireCache[moduleName] = requirement;
      return requirement;
    }
  );
  interpreter.setProperty(scope, "require", nativeRequire);
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
