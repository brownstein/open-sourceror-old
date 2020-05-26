import {
  Body,
  Box
} from "p2";
import {
  Color,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";

import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";

const WATER_RESOLUTION = 8;

// TODO
export class SmallBodyOfWater {
  constructor(props) {
    this.width = props.width || 100;
    this.height = props.height || 100;
    this.position = castToVec2(props.position);

    this.body = new Body({
      mass: 0,
      position: this.position
    });
    this.body.addShape(new Box({
      sensor: true,
      width: this.width,
      height: this.height
    }));

    this.mesh = getThreeJsObjectForP2Body(this.body, false);
    this.mesh.position.x = this.body.position[0];
    this.mesh.position.y = this.body.position[1];
    this.mesh.position.z = 1.2;
    this.mesh.children[0].material.color = new Color(0, 0.5, 1);
    this.mesh.children[0].material.opacity = 0.6;
  }
  collisionHandler(engine, otherBodyId, otherEntity) {
  }
  endCollisionHandler(engine, otherBodyId, otherEntity) {
  }
}

// TODO
export class Splach {
  constructor(position) {
    this.engine = null;

    this.mesh = new Mesh(geometry, mat);

    this._destory = this._destroy.bind(this);
    setTimeout(this._destory, 200);
  }
  _destroy() {
    this.engine.removeEntity(this);
  }
}
