import { castToVec2 } from "p2-utils/vec2-utils";

export default function getNativeFireSpell (interpreter, scope, runner) {

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

  return nativeFireball;
}
