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

    this._removeCallback = this._removeCallback.bind(this);
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
  collisionHandler(engine, shapeId, otherId, otherEntity) {
    if (otherEntity === this.followingEntity) {
      return;
    }
    if (otherEntity.isTerrain || otherEntity.isEnvironmental) {
      return;
    }
    if (otherEntity instanceof EphemeralEntity) {
      return;
    }
    if (otherEntity.dead) {
      return;
    }
    this.collidingWith.push([otherId, otherEntity]);
    this.updateHandler && this.updateHandler();
    if (otherEntity.on) {
      otherEntity.on("remove", this._removeCallback);
    }
  }
  endCollisionHandler(engine, shapeId, otherId, otherEntity) {
    if (otherEntity === this.followingEntity) {
      return;
    }
    this.collidingWith = this.collidingWith.filter(c => c[0] !== otherId);
    this.updateHandler && this.updateHandler();
    if (otherEntity && otherEntity.off) {
      otherEntity.off("remove", this._removeCallback);
    }
  }
  setRadius(radius) {
    this.shape.radius = radius;
    this.mesh.scale.x = radius / this.initialRadius;
    this.mesh.scale.y = radius / this.initialRadius;
  }
  _removeCallback({ entity }) {
    const entityId = entity.body.id;
    this.collidingWith = this.collidingWith.filter(c => c[0] !== entityId);
    this.updateHandler && this.updateHandler();
  }
}
