"use strict";

function hookIntoInterpreter (interpreter, scope) {
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

  return;

  const PROMISE = interpreter.createNativeFunction(
    function (nativeCB) {
      if (interpreter.calledWithNew()) {
        console.log("new Promise");
      }
    },
    true
  );

  interpreter.setProperty(scope, "Promise", PROMISE);

  interpreter.setProperty(
    PROMISE,
    "resolve",
    interpreter.createNativeFunction(
      function (resolveValue) {
        console.log("RESOLVE");
        console.log(resolveValue);
        const resolution = Promise.resolve(resolveValue);
        return interpreter.createObject({
          then: interpreter.createNativeFunction(thenBody => {
            console.log(thenBody);
          })
        });
      }
    )
  );
}

module.exports = hookIntoInterpreter;
