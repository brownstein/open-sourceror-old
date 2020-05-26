import { vec2 } from "p2";

import { Sensor } from "src/entities/sensor";

export default function getNativeSensor(interpreter, scope, runner) {
  /**
   * Native sensor creation fucntion
   */
  const nativeSensor = interpreter.createNativeFunction(
    function(radius) {
      console.log("mounting sensor");

      // apply mana cost to player
      runner.callingEntity.incrementMana &&
      runner.callingEntity.incrementMana(-1);

      this.cleanupEffect = () => {
        console.log("cleaning up sensor");
        runner.engine.removeEntity(this.sensor);
      }
      runner.cleanupEffects.push(this.cleanupEffect);
      this.sensor = new Sensor(runner.callingEntity, radius || 50);
      this.sensor.attachUpdateHandler(
        () => {
          const nearby = this.sensor.collidingWith.map(([id, c]) => {
            const relativePosition = [0, 0];
            vec2.sub(
              relativePosition,
              c.body.position,
              runner.callingEntity.body.position
            );
            return {
              type: c.constructor.name,
              relativePosition: {
                x: relativePosition[0],
                y: relativePosition[1]
              }
            };
          });
          // sometimes the sensor fires this after the interpreter has finished
          // in that case, ignore the problem
          try {
            this.near = interpreter.nativeToPseudo(nearby);
            interpreter.setProperty(this, "near", this.near);
          }
          catch (err) {
            return;
          }
        }
      );
      this.near = interpreter.nativeToPseudo([]);
      interpreter.setProperty(this, "near", this.near);
      runner.engine.addEntity(this.sensor);
      return this;
    },
    true
  );
  interpreter.setNativeFunctionPrototype(
    nativeSensor,
    "getNearbyThings",
    function() {
      return this.near;
    }
  );
    interpreter.setNativeFunctionPrototype(
      nativeSensor,
      "setRadius",
      function(nativeRadius) {
        const radius = interpreter.pseudoToNative(nativeRadius);
        this.sensor.setRadius(radius);
      }
    );

  return nativeSensor;
}
