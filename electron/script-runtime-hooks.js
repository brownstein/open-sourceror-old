"use strict";
const acorn = require("acorn");
const fs = require("fs");

function initScope (interpreter, scope) {
  interpreter.setProperty(
    scope,
    "on",
    interpreter.createNativeFunction(
      (condition, func) => {
        setTimeout(
          () => interpreter.queueCall(func, [null]),
          10
        );
      }
    )
  );

  interpreter.setProperty(
    scope,
    "NEARBY_ENEMY",
    interpreter.nativeToPseudo("NEARBY_ENEMY")
  );

  interpreter.setProperty(
    scope,
    "getDirection",
    interpreter.createNativeFunction(
      entity => interpreter.nativeToPseudo([0, 0, 1])
    )
  );

  interpreter.setProperty(
    scope,
    "fire",
    interpreter.createNativeFunction(
      direction => {
        console.log("fire cast:", interpreter.pseudoToNative(direction));
      }
    )
  );

  interpreter.setProperty(
    scope,
    "log",
    interpreter.createNativeFunction(f => {
      console.log(interpreter.pseudoToNative(f));
      return interpreter.nativeToPseudo(undefined);
    })
  );

  interpreter.setProperty(
    scope,
    "setTimeout",
    interpreter.createNativeFunction(
      (nativeCB, nativeTimeout) => {
        const timeout = interpreter.pseudoToNative(nativeTimeout);
        setTimeout(() => interpreter.queueCall(nativeCB, []), timeout);
      }
    )
  );
}

function doPolyfills (interpreter) {
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
}

module.exports = {
  doPolyfills,
  initScope
};
