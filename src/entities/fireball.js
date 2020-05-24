import { Body, Circle, vec2 } from "p2";

import getThreeJsObjectForP2Body from "../p2-utils/get-threejs-mesh";
import BaseEntity from "entities/base";

export class Fireball extends BaseEntity {
  constructor (spawnedByEntiy, position) {
    super();
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
  collisionHandler(engine, otherEntity) {
    if (
      otherEntity === this.spawnedByEntiy ||
      otherEntity instanceof Fireball
    ) {
      return;
    }
    engine.addEntity(new FireballExplosion(this.body.interpolatedPosition));
    engine.removeEntity(this);
  }
}

export class FireballExplosion extends BaseEntity {
  constructor(position) {
    super();
    this.r = 5;
    this.body = new Body({
      mass: 0,
      position: vec2.clone(position)
    });
    const circleShape = new Circle({
      radius: 1,
      sensor: true
    });
    this.body.addShape(circleShape);

    this.mesh = getThreeJsObjectForP2Body(this.body, false);
    this.mesh.scale.x = this.r;
    this.mesh.scale.y = this.r;
  }
  onFrame(deltaTimeMs) {
    this.r += deltaTimeMs * 0.02;
    this.body.shapes[0].radius = this.r;
    this.mesh.scale.x = this.r;
    this.mesh.scale.y = this.r;
    if (this.r > 10) {
      this.engine.removeEntity(this);
    }
  }
}
