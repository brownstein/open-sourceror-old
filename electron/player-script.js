"use strict";

const script =
`"use strict";
// language of the ancients (es5)

on(NEARBY_ENEMY, function (enemy) {
  log(1);
  fire(getDirection(enemy));
});
log(0);
`;

const _script =
`"use strict";
log(1);
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
}

module.exports = {
  script,
  hookIntoInterpreter
};
