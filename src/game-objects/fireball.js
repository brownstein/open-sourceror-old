import { Body, Circle, vec2 } from "p2";

import getThreeJsObjectForP2Body from "../p2-utils/get-threejs-mesh";

export class Fireball {
  constructor (spawnedByEntiy, position) {
    this.spawnedByEntiy = spawnedByEntiy;

    this.body = new Body({
      mass: 2,
      damping: 0.1,
      friction: 0.9,
      position: vec2.clone(position),
      gravityScale: 0.5
    });

    const circleShape = new Circle({
      radius: 4,
      sensor: true
    });

    this.body.addShape(circleShape);

    this.mesh = getThreeJsObjectForP2Body(this.body, false);
  }
  syncMeshWithBody(timeDelta) {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
  collisionHandler(engine, otherEntity) {
    if (
      otherEntity === this.spawnedByEntiy ||
      otherEntity instanceof Fireball
    ) {
      return;
    }
    engine.removeEntity(this);
  }
}
