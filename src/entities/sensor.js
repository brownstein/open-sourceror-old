import {
  Body,
  Circle,
  vec2
} from "p2";

import { EphemeralEntity } from "./base";
import { TerrainEntity } from "./terrain";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";

export class Sensor extends EphemeralEntity {
  constructor(followingEntity, radius = 10) {
    super();

    this.body = new Body({
      mass: 1,
      gravityScale: 0,
      position: vec2.clone(followingEntity.body.interpolatedPosition)
    });
    this.shape = new Circle({
      radius,
      sensor: true
    });
    this.body.addShape(this.shape);
    this.mesh = getThreeJsObjectForP2Body(this.body, false);

    this.initialRadius = radius;
    this.followingEntity = followingEntity;
    this.collidingWith = [];
    this.updateHandler = null;
  }
  attachUpdateHandler(handler) {
    this.updateHandler = handler;
  }
  onFrame() {
    vec2.copy(
      this.body.position,
      this.followingEntity.body.interpolatedPosition
    );
    vec2.copy(
      this.body.velocity,
      this.followingEntity.body.velocity
    );
  }
  collisionHandler(engine, otherEntity) {
    if (otherEntity === this.followingEntity) {
      return;
    }
    if (otherEntity instanceof TerrainEntity) {
      return;
    }
    if (otherEntity instanceof EphemeralEntity) {
      return;
    }
    this.collidingWith.push(otherEntity);
    this.updateHandler && this.updateHandler();
  }
  endCollisionHandler(engine, otherEntity) {
    if (otherEntity === this.followingEntity) {
      return;
    }
    this.collidingWith = this.collidingWith.filter(c => c !== otherEntity);
    this.updateHandler && this.updateHandler();
  }
  setRadius(radius) {
    this.shape.radius = radius;
    this.mesh.scale.x = radius / this.initialRadius;
    this.mesh.scale.y = radius / this.initialRadius;
  }
}
