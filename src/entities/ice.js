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

export class IceCrystal extends BaseEntity {
  static createIceCrystal(engine, position, size = 16) {

    // create regions
    const regions = [];
    for (let i = 0; i < 5; i++) {
      const theta = Math.random() * Math.PI * 2;
      const u = [Math.cos(theta), Math.sin(theta)];
      const v = [-Math.sin(theta), Math.cos(theta)];
      const offsetX = Math.random() * 16 - 8;
      const offsetY = Math.random() * 16 - 8;
      const region = [
        [-6, -12],
        [0, -16],
        [6, -12],
        [6, 12],
        [0, 16],
        [-6, 12]
      ];
      for (let vi = 0; vi < region.length; vi++) {
        const [x, y] = region[vi];
        region[0] *= size / 16;
        region[1] *= size / 16;
        region[0] = u[0] * x + v[0] * y + offsetX;
        region[1] = u[1] * x * v[1] * y + offsetY;
        region[0] += Math.random() * 2 - 1;
        region[1] += Math.random() * 2 - 1;
      }
    }

    // merge the regions into a single crystal
    const mergedRegions = regions.slice(1, regions.length).reduce(
      (merged, region) => PolyBool.union(
        merged,
        {
          regions: [region],
          inverted: false
        }
      ),
      {
        regions: [regions[0]],
        inverted: false
      }
    );

    const combinedPolygon = mergedRegions[0][0];
    return new IceCrystal(position, combinedPolygon);
  }
  constructor(params) {
    const position = params.position || new Vector2(0, 0);
    const vertices = params.vertices;

    this.body = new Body({
      mass: 0,
      isStatic: true,
      friction: 0.9,
      position: [0, 0]
    });
    this.convex = new Convex({
      vertices: []
    });
    this.body.addShape(convex);

    this.mesh = getThreeJsObjectForP2Body(this.body);
  }
}
