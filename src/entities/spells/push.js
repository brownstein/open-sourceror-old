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
import BaseEntity from "src/entities/base";

export class Push extends BaseEntity {
  constructor(spawnedByEntity, position, radius, force) {
    super();
    this.spawnedByEntity = spawnedByEntity;

    this.body = new Body({
      mass: 0,
      position: castToVec2(position)
    });

    this.sensor = new Shape({
      radius
    });

    this.body.addShape(this.sensor);

    this.syncMeshWithBody();
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
}
