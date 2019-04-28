"use strict";

const Interpreter = require("js-interpreter");
const patchJSInterpreter = require("./async-js-interpreter-patch");

// add support for queueCall
patchJSInterpreter(Interpreter);

module.exports = function setupInterpreter (script) {
  const playerEventCallbacks = {};
  const interpreter = new Interpreter (
    script,
    (interpreter, globalScope) => {

      // setup event listener pattern
      interpreter.setProperty(
        globalScope,
        "on",
        interpreter.createNativeFunction(
          (condition, cb) => {
            const eventCondition = interpreter.pseudoToNative(condition);
            playerEventCallbacks[eventCondition] = (...args) => interpreter.queueCall(
              cb,
              args.map(a => interpreter.nativeToPseudo(a))
            );
          }
        )
      );
    }
  );
};
