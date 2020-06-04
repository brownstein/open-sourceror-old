import {
  Body,
  Convex,
  Material,
  vec2
} from "p2";
import PolyBool from "polybooljs";
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
import { castToVec2 } from "src/p2-utils/vec2-utils";

export class EarthBlock extends BaseEntity {
  static createTerrainBlock(engine, position, blockSize = 16, size = 16) {
    const roundedPosition = new Vector2(
      Math.floor(position.x / blockSize) * blockSize,
      Math.floor(position.y / blockSize) * blockSize
    );
  }
}
