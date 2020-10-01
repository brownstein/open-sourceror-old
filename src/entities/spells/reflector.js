import {
  Body,
  Convex,
  Material,
  vec2
} from "p2";
import {
  Color,
  Face3,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Vector2,
  Vector3,
} from "three";

import BaseEntity from "src/entities/base";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import { castToVec2, vec2ToVector3 } from "src/p2-utils/vec2-utils";

export class Reflector extends BaseEntity {
  constructor(props) {
    super(props);
    this.reflects = true;

    this.fromEntity = props.fromEntity;

    this.startPosition = vec2ToVector3(props.position);
    this.startTangent = vec2ToVector3(props.vector);
    this.startTangent.normalize();

    this.relativePosition = new Vector3();
    this.relativePosition.add(this.startPosition);
    const entityPosition = vec2ToVector3(props.fromEntity.body.position);
    this.relativePosition.sub(entityPosition);

    const width = props.width ? props.width : 32;
    const length = props.length ? props.length : 4;

    // create and scale base vertices
    const rect = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ];
    rect.forEach(v => {
      v[0] = v[0] * width / 2;
      v[1] = v[1] * length / 2;
    });

    const convex = new Convex({ vertices: rect });

    this.body = new Body({
      mass: 0,
      isStatic: false,
    });
    this.body.addShape(convex);
    this.body.angle = new Vector2().copy(this.startTangent).angle();
    this.mesh = getThreeJsObjectForP2Body(this.body);

    this.lifeSpan = 1000;
  }
  onFrame(timeDelta) {
    vec2.copy(this.body.position, this.fromEntity.body.interpolatedPosition);
    this.body.position[0] += this.relativePosition.x;
    this.body.position[1] += this.relativePosition.y;

    this.lifeSpan -= timeDelta;
    if (this.lifeSpan <= 0) {
      this.engine.removeEntity(this);
    }
  }
}
