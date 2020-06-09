import { vec2 } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import { Fireball } from "src/entities/projectiles/fireball";
import { OutOfManaError } from "../errors";

export default function getNativeFireSpell (interpreter, scope, runner) {

  const MANA_COST = 5;

  // add support for casting fireball
  const nativeFireball = interpreter.createNativeFunction(
    (rawRelativePosition, rawRelativeVelocity) => {

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
      if (rawRelativeVelocity) {
        relativeVelocity = castToVec2(
          interpreter.pseudoToNative(rawRelativeVelocity)
        );
      }

      const fireballPosition = vec2.clone(callingEntity.body.position);
      if (relativePosition) {
        vec2.add(fireballPosition, fireballPosition, relativePosition);
      }
      else {
        fireballPosition[0] += callingEntity.facingRight ? 30 : -30;
      }

      const fireball = new Fireball(callingEntity, fireballPosition);
      vec2.copy(fireball.body.velocity, callingEntity.body.velocity);
      if (relativeVelocity) {
        vec2.add(
          fireball.body.velocity,
          fireball.body.velocity,
          relativeVelocity
        );
      }
      else {
        fireball.body.velocity[0] += callingEntity.facingRight ? 200 : -100;
        fireball.body.velocity[1] -= 100;
      }

      engine.addEntity(fireball);

      return interpreter.nativeToPseudo(undefined);
    }
  );

  return nativeFireball;
}
