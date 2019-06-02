"use strict";

const _script =
`"use strict";
// language of the ancients (es5)

on(NEARBY_ENEMY, function (enemy) {
  log(1);
  fire(getDirection(enemy));
});
log(0);
`;

const script =
`"use strict";
setTimeout(() => log(1), 100);
// on(NEARBY_ENEMY, (enemy) => {
//   try {
//     log(enemy);
//   }
//   catch (err) {
//     log(err);
//   }
// });
`;

function hookIntoInterpreter (interpreter, scope) {
  interpreter.setProperty(
    scope,
    "on",
    interpreter.createNativeFunction(
      (condition, func) => {
        console.log(interpreter.pseudoToNative(condition));
        setTimeout(
          () => interpreter.queueCall(func, [null]),
          1000
        );
      }
    )
  )
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
    "setTimeout",
    interpreter.createNativeFunction(
      (nativeCB, nativeTimeout) => {
        const timeout = interpreter.pseudoToNative(nativeTimeout);
        setTimeout(() => interpreter.queueCall(nativeCB, []), timeout);
      }
    )
  );
}

module.exports = {
  script,
  hookIntoInterpreter
};
