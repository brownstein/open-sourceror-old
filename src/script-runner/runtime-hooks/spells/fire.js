import { castToVec2 } from "p2-utils/vec2-utils";

export default function getNativeFireSpell (interpreter, scope, runner) {

  // add support for casting fireball
  const nativeFireball = interpreter.createNativeFunction(
    (rawRelativePosition, rawRelativeVelocity) => {

      const availableMana = runner.callingEntity.getMana();
      if (availableMana < 1) {
        throw new Error("OUT OF MANA");
      }

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

      // apply mana cost to player
      runner.callingEntity.incrementMana &&
      runner.callingEntity.incrementMana(-1);

      return interpreter.nativeToPseudo(undefined);
    }
  );

  return nativeFireball;
}
