import { castToVec2 } from "src/p2-utils/vec2-utils";
import { Push } from "src/entities/spells/push";

export default function getNativePushSpell (interpreter, scope, runner) {
  const { engine } = runner;

  const nativePush = interpreter.createNativeFunction(
    (rawRelativePosition, rawRelativeVelocity) => {

      let relativePosition = vec2.create();
      if (rawRelativePosition) {
        relativePosition = castToVec2(
          interpreter.pseudoToNative(rawRelativePosition)
        );
      }

      const casterPosition = engine.controllingEntity.body.position;
      const fromPosition = vec2.clone(casterPosition);
      if (relativePosition) {
        vec2.add(fromPosition, fromPosition, relativePosition);
      }

      const caster = runner.callingEntity;
      const push = new Push(caster, relativePosition, 50, 50);

      engine.addEntity(push);

      return interpreter.nativeToPseudo(undefined);
    }
  );

  return nativePush;
}
