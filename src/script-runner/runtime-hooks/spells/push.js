import { vec2 } from "p2";
import { castToVec2, vec2ToVector3 } from "src/p2-utils/vec2-utils";
import { Push } from "src/entities/spells/push";

export default function getNativePushSpell (interpreter, scope, runner) {
  const { engine } = runner;

  const nativePush = interpreter.createNativeFunction(
    (rawRelativePosition, rawRadius, rawForce) => {

      let relativePosition = vec2.create();
      let radius = 10;
      let force = 100;

      if (rawRelativePosition) {
        relativePosition = castToVec2(
          interpreter.pseudoToNative(rawRelativePosition)
        );
      }
      if (rawRadius) {
        radius = interpreter.pseudoToNative(rawRadius);
      }
      if (rawForce) {
        force = interpreter.pseudoToNative(rawForce);
      }

      const rawDist = vec2.length(relativePosition);
      const manaCost = Math.sqrt(rawDist) * radius * force * 0.001;

      const availableMana = runner.callingEntity.getMana();
      if (availableMana < manaCost) {
        throw new Error("insufficient mana");
      }

      // apply mana cost to player
      runner.callingEntity.incrementMana &&
      runner.callingEntity.incrementMana(-manaCost);

      const casterPosition = engine.controllingEntity.body.position;
      const fromPosition = vec2.clone(casterPosition);
      if (relativePosition) {
        vec2.add(fromPosition, fromPosition, relativePosition);
      }

      const caster = runner.callingEntity;
      const push = new Push(caster, fromPosition, radius, force);

      engine.addEntity(push);

      return interpreter.nativeToPseudo(undefined);
    }
  );

  return nativePush;
}
