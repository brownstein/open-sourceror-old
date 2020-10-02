import { vec2 } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import { Reflector } from "src/entities/spells/reflector";
import { OutOfManaError } from "../errors";

export default function getNativeReflector(interpreter, scope, runner) {

  const MANA_COST = 5;

  // add support for casting fireball
  const nativeReflector = interpreter.createNativeFunction(
    function (rawRelativePosition) {

      const {
        engine,
        callingEntity
      } = runner;

      if (callingEntity.getMana() < MANA_COST) {
        throw new OutOfManaError();
      }
      callingEntity.incrementMana(-MANA_COST);

      let relativePosition = null;
      let relativeVelocity = null;
      if (rawRelativePosition) {
        relativePosition = castToVec2(
          interpreter.pseudoToNative(rawRelativePosition)
        );
      }
      // if (rawRelativeVelocity) {
      //   relativeVelocity = castToVec2(
      //     interpreter.pseudoToNative(rawRelativeVelocity)
      //   );
      // }

      const reflectorPosition = vec2.clone(callingEntity.body.position);
      if (relativePosition) {
        vec2.add(reflectorPosition, reflectorPosition, relativePosition);
      }
      else {
        reflectorPosition[0] += callingEntity.facingRight ? 64 : -64;
      }

      const reflector = new Reflector({
        fromEntity: callingEntity,
        position: reflectorPosition,
        vector: [1, 1]
      });

      vec2.copy(reflector.body.velocity, callingEntity.body.velocity);
      if (relativeVelocity) {
        vec2.add(
          reflector.body.velocity,
          reflector.body.velocity,
          relativeVelocity
        );
      }

      engine.addEntity(reflector);

      return interpreter.nativeToPseudo(undefined);
    },
    true
  );

  return nativeReflector;
}
