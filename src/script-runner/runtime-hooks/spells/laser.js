import { vec2 } from "p2";
import { castToVec2 } from "p2-utils/vec2-utils";
import { Laser } from "src/entities/spells/laser";

export default function getNativeLaser (interpreter, scope, runner) {

  const MANA_COST = 5;

  const nativeLaser = interpreter.createNativeFunction(
    function (rawOptions) {

      const {
        engine,
        callingEntity
      } = runner;

      if (callingEntity.getMana() < MANA_COST) {
        throw new OutOfManaError();
      }
      callingEntity.incrementMana(-MANA_COST);

      let options = {};
      if (rawOptions) {
        options = interpreter.pseudoToNative(rawOptions);
      }

      let relativePosition = null;
      let vector = null;
      if (options.relativePosition) {
        relativePosition = castToVec2(options.relativePosition);
      }
      if (options.direction) {
        vector = castToVec2(options.direction);
      }
      else {
        const targetingPosition = engine.controllingEntity.targetCoordinates;
        vector = vec2.create();
        vec2.copy(vector, castToVec2(targetingPosition));
        vec2.sub(vector, vector, fromPosition);
        vec2.normalize(vector, vector);
      }

      const casterPosition = engine.controllingEntity.body.position;
      const fromPosition = vec2.clone(casterPosition);
      if (relativePosition) {
        vec2.add(fromPosition, fromPosition, relativePosition);
      }

      const laser = new Laser({
        fromEntity: callingEntity,
        position: fromPosition,
        vector
      });
      laser.lifeSpan = Infinity;
      engine.addEntity(laser);

      // make sure to de-spawn laser when script finishes
      this.cleanupEffect = () => {
        runner.engine.removeEntity(laser);
      };
      runner.cleanupEffects.push(this.cleanupEffect);

      this.off = function() {
        laser.on = false;
        return interpreter.nativeToPseudo(undefined);
      };
      this.on = function() {
        laser.on = true;
        return interpreter.nativeToPseudo(undefined);
      };
      interpreter.setProperty(this, "off",
        interpreter.createNativeFunction(this.off));
      interpreter.setProperty(this, "on",
        interpreter.createNativeFunction(this.on));

      // TODO: on, off, charging, targeting

      return interpreter.nativeToPseudo(undefined);
    },
    true
  );

  return nativeLaser;
}
