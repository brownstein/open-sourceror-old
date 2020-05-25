import { vec2 } from "p2";

import { Sensor } from "src/entities/sensor";

export default function getNativeSensor(interpreter, scope, runner) {
  /**
   * Native sensor creation fucntion
   */
  const nativeSensor = interpreter.createNativeFunction(
    function(radius) {
      console.log("mounting sensor");
      this.cleanupEffect = () => {
        console.log("cleaning up sensor");
        runner.engine.removeEntity(this.sensor);
      }
      runner.cleanupEffects.push(this.cleanupEffect);
      this.sensor = new Sensor(runner.callingEntity, radius || 50);
      this.sensor.attachUpdateHandler(
        () => {
          const nearby = this.sensor.collidingWith.map(c => {
            const relativePosition = [0, 0];
            vec2.sub(
              relativePosition,
              c.body.position,
              runner.callingEntity.body.position
            );
            return {
              type: c.constructor.name,
              relativePosition
            };
          });
          this.near = interpreter.nativeToPseudo(nearby);
          // sometimes the sensor fires this after the interpreter has finished
          // in that case, ignore the problem
          try {
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
  const nativeSensorGet = function() {
    console.log("THIS.GET", this);
    return interpreter.pseudoToNative(1000);
  }
  interpreter.setNativeFunctionPrototype(nativeSensor, "get", nativeSensorGet);

  return nativeSensor;
}
