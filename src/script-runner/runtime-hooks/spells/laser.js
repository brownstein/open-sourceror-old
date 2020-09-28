import { vec2 } from "p2";
import { castToVec2 } from "p2-utils/vec2-utils";
import { Laser } from "src/entities/spells/laser";

export default function getNativeLaser (interpreter, scope, runner) {
  const { engine } = runner;

  const nativeLaser = interpreter.createNativeFunction(
    (rawRelativePosition, rawRelativeTargetPosition) => {

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
      if (rawRelativeVelocity) {
        vec2.sub(vector, fromPosition, relativeTargetPosition);
      }
      else {
        vec2.sub(vector, fromPosition, targetingPosition);
      }

      // const laser = new Laser(relativePosition, vector);
      // engine.addEntity(laser);
    }
  );

  return nativeLaser;
}
