import { vec2 } from "p2";
import { castToVec2, vec2ToVector3 } from "src/p2-utils/vec2-utils";
import { IceCrystal } from "src/spells/ice";

export default function getNativeIce (interpreter, scope, runner) {
  const engine = runner.engine;

  const nativeIce = interpreter.createNativeFunction(
    (rawRelativePosition) => {
      const { callingEntity } = runner;

      const availableMana = callingEntity.getMana();
      if (availableMana < 1) {
        throw new Error("OUT OF MANA");
      }

      let relativePosition = null;
      if (rawRelativePosition) {
        relativePosition = castToVec2(
          interpreter.pseudoToNative(rawRelativePosition)
        );
      }

      const position = vec2.clone(callingEntity.body.position);
      vec2.add(position, position, relativePosition);

      const pos2 = castToVec2(position);

      IceCrystal.createIceCrystal(engine, pos2, 16);

      runner.callingEntity.incrementMana(-1);

      return interpreter.nativeToPseudo(undefined);
    }
  );
}
