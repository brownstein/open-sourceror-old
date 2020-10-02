import { vec2 } from "p2";
import { castToVec2, vec2ToVector3 } from "p2-utils/vec2-utils";
import {
  castDirectionToVec2,
  getOptionsFromObjectWithDefaults
} from "src/utils/casting-utils";
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

      // extract options
      let nativeOptions = {};
      if (rawOptions) {
        nativeOptions = interpreter.pseudoToNative(rawOptions);
      }
      const options = getOptionsFromObjectWithDefaults(nativeOptions, {
        intensity: 1,
        relativePosition: [[0, 0], castToVec2],
        direction: [null, castDirectionToVec2]
      });

      const relativePosition = options.relativePosition;
      let vector = null;
      if (options.direction) {
        vector = options.direction;
        vec2.normalize(vector, vector);
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
      interpreter.setProperty(this, "off",
        interpreter.createNativeFunction(this.off));

      this.on = function() {
        laser.on = true;
        return interpreter.nativeToPseudo(undefined);
      };
      interpreter.setProperty(this, "on",
        interpreter.createNativeFunction(this.on));

      this.aim = function(nativeDirection) {
        const direction = castDirectionToVec2(
          interpreter.pseudoToNative(nativeDirection));
        laser.startTangent.copy(vec2ToVector3(direction));
        return interpreter.nativeToPseudo(undefined);
      };
      interpreter.setProperty(this, "aim",
        interpreter.createNativeFunction(this.aim));

      // TODO: on, off, charging, targeting

      return interpreter.nativeToPseudo(undefined);
    },
    true
  );

  return nativeLaser;
}
