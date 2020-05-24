import * as acorn from "acorn";
import { castToVec2 } from "p2-utils/vec2-utils";
import promisePolyfill from "./promise-polyfill.txt";

/**
 * Initialize the interpreter scope with global functions
 */
export function initializeScope(interpreter, scope, runner) {

  // add support for console.log and 'log' shorthand
  const nativeConsole = interpreter.createObject();
  const nativeLogFunc = interpreter.createNativeFunction((...args) => {
    const nativeArgs = args.map(a => interpreter.pseudoToNative(a));
    console.log(...nativeArgs);
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

  // add support for casting fireball
  const nativeFireball = interpreter.createNativeFunction(
    (rawRelativePosition, rawRelativeVelocity) => {
      let relativePosition = null;
      let relativeVelocity = null;
      if (rawRelativePosition) {
        relativePosition = castToVec2(
          interpreter.pseudoToNative(rawRelativePosition)
        );
      }
      if (rawRelativeVelocity) {
        relativeVelocity = castToVec2(
          interpreter.pseudoToNative(rawRelativeVelocity)
        );
      }
      runner.callingEntity.castFireball(relativePosition, relativeVelocity);
      return interpreter.nativeToPseudo(undefined);
    }
  );
  interpreter.setProperty(scope, "fire", nativeFireball);

  const nativeSensorPrototype = interpreter.createObject();

  /**
   * Native sensor creation fucntion
   */
  const nativeSensor = interpreter.createNativeFunction(
    function() {
      console.log("mounting sensor");
      this.cleanupEffect = () => console.log("cleaning up sensor");
      runner.cleanupEffects.push(this.cleanupEffect);
      this.vv = "v";
      interpreter.setProperty(this, "v", interpreter.nativeToPseudo("val"));
      return this;
    },
    true
  );
  const nativeSensorGet = function() {
    console.log("THIS.G", this);
    return interpreter.pseudoToNative(1000);
  }
  interpreter.setNativeFunctionPrototype(nativeSensor, "G", nativeSensorGet);

  /**
   * Native require function to get other functions
   */
  const nativeRequire = interpreter.createNativeFunction(
    rawModuleName => {
      const moduleName = interpreter.pseudoToNative(rawModuleName);
      let requirement = null;
      switch (moduleName) {
        case "fire":
          return nativeFireball;
        case "sensor":
          return nativeSensor;
        default:
          throw new Error("Unknown module - have you tried getting gud?");
      }
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
