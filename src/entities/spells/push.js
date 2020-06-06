import {
  Body,
  Circle,
  vec2
} from "p2";
import {
  Vector2,
  Vector3
} from "three";

import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import BaseEntity, { EphemeralEntity } from "src/entities/base";

export class Push extends BaseEntity {
  constructor(spawnedByEntity, position, radius, force) {
    super();
    this.spawnedByEntity = spawnedByEntity;
    this.force = force;

    this.body = new Body({
      mass: 0,
      position: castToVec2(position)
    });
    this.sensor = new Circle({
      radius: 1
    });
    this.body.addShape(this.sensor);
    this.mesh = getThreeJsObjectForP2Body(this.body);

    this.startRadius = radius * 0.25;
    this.eventualRadius = radius;
    this.timeSpan = 100;
    this.radiusGrowthRate = (this.eventualRadius - this.startRadius) / this.timeSpan;

    this.sensor.radius = this.startRadius;

    this._destroy = this._destroy.bind(this);
    setTimeout(this._destroy, this.timeSpan);
  }
  onFrame() {
    this.sensor.radius += this.radiusGrowthRate;
    this.mesh.scale.x = this.sensor.radius;
    this.mesh.scale.y = this.sensor.radius;
  }
  collisionHandler(engine, shapeId, otherId, otherEntity) {
    if (
      otherEntity === this.spawnedByEntity ||
      otherEntity instanceof EphemeralEntity
    ) {
      return;
    }

    const relativePosition = vec2.create();
    vec2.sub(relativePosition, otherEntity.body.position, this.body.position);

    const relativeForce = vec2.create();
    vec2.copy(relativeForce, relativePosition);
    vec2.normalize(relativeForce, relativeForce);
    vec2.scale(relativeForce, relativeForce, this.force);

    otherEntity.body.applyForce(
      relativePosition,
      relativeForce
    );
  }
  _destroy() {
    const { engine } = this;
    engine.removeEntity(this);
  }
}
