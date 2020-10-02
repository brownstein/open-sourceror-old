import { vec2 } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import {
  castDirectionToVec2,
  getOptionsFromObjectWithDefaults
} from "src/utils/casting-utils";
import { Reflector } from "src/entities/spells/reflector";
import { OutOfManaError } from "../errors";

export default function getNativeReflector(interpreter, scope, runner) {

  const MANA_COST = 5;

  // add support for casting fireball
  const nativeReflector = interpreter.createNativeFunction(
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
        relativePosition: [[0, 0], castToVec2],
        direction: [null, castDirectionToVec2]
      });

      const {
        relativePosition,
        direction
      } = options;

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
        vector: direction || [1, 0]
      });
      reflector.lifeSpan = Infinity;

      vec2.copy(reflector.body.velocity, callingEntity.body.velocity);
      engine.addEntity(reflector);

      // make sure to de-spawn reflector when script finishes
      this.cleanupEffect = () => {
        runner.engine.removeEntity(reflector);
      };
      runner.cleanupEffects.push(this.cleanupEffect);

      this.move = function(nativeVect) {
        const vect = castToVec2(interpreter.pseudoToNative(nativeVect));
        reflector.relativePosition.x += vect[0];
        reflector.relativePosition.y += vect[1];
      };
      interpreter.setProperty(this, "move",
        interpreter.createNativeFunction(this.move));

      this.rotate = function(nativeDelta) {
        const delta = interpreter.pseudoToNative(nativeDelta);
        reflector.body.angle += delta;
      }
      interpreter.setProperty(this, "rotate",
        interpreter.createNativeFunction(this.rotate));

      return interpreter.nativeToPseudo(undefined);
    },
    true
  );

  return nativeReflector;
}
