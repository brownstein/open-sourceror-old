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

    this.body = new Body({
      mass: 0,
      position: castToVec2(position)
    });
    this.sensor = new Circle({
      radius
    });
    this.body.addShape(this.sensor);
    this.mesh = getThreeJsObjectForP2Body(this.body);

    this._destroy = this._destroy.bind(this);
    setTimeout(this._destroy, 500);
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
    vec2.scale(relativeForce, relativeForce, 10);

    otherBody.applyForce(
      relativePosition,
      relativeForce
    );
  }
  _destroy() {
    const { engine } = this;
    engine.removeEntity(this);
  }
}
