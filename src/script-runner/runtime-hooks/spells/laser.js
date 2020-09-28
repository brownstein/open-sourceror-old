import { vec2 } from "p2";
import { castToVec2 } from "p2-utils/vec2-utils";
import { Laser } from "src/entities/spells/laser";

export default function getNativeLaser (interpreter, scope, runner) {

  const MANA_COST = 5;

  const nativeLaser = interpreter.createNativeFunction(
    (rawRelativePosition, rawRelativeTargetPosition) => {

      const {
        engine,
        callingEntity
      } = runner;

      if (callingEntity.getMana() < MANA_COST) {
        throw new OutOfManaError();
      }
      callingEntity.incrementMana(-MANA_COST);

      let relativePosition = null;
      let relativeTargetPosition = null;
      if (rawRelativePosition) {
        relativePosition = castToVec2(
          interpreter.pseudoToNative(rawRelativePosition)
        );
      }
      if (rawRelativeTargetPosition) {
        relativeTargetPosition = castToVec2(
          interpreter.pseudoToNative(rawRelativeTargetPosition)
        );
      }

      const casterPosition = engine.controllingEntity.body.position;
      const fromPosition = vec2.clone(casterPosition);
      if (relativePosition) {
        vec2.add(fromPosition, fromPosition, relativePosition);
      }

      const targetingPosition = engine.controllingEntity.targetCoordinates;
      const vector = vec2.create();
      vec2.copy(vector, castToVec2(targetingPosition));
      vec2.sub(vector, vector, fromPosition);
      vec2.normalize(vector, vector);

      const laser = new Laser({
        fromEntity: callingEntity,
        position: fromPosition,
        vector
      });
      engine.addEntity(laser);

      // TODO: on, off, charging, targeting
    }
  );

  return nativeLaser;
}
