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

import BaseEntity, { EphemeralEntity } from "src/entities/base";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import { castToVec2 } from "src/p2-utils/vec2-utils";

export class IceCrystal extends BaseEntity {
  static createIceCrystal(engine, position, size = 16) {

    // create regions
    const convexes = [];
    for (let i = 0; i < 5; i++) {
      const theta = Math.random() * Math.PI * 2;
      const u = [Math.cos(theta), Math.sin(theta)];
      const v = [-Math.sin(theta), Math.cos(theta)];
      const offsetX = Math.random() * 4 - 2;
      const offsetY = Math.random() * 4 - 2;
      const region = [
        [-6, -12],
        [0, -16],
        [6, -12],
        [6, 12],
        [0, 16],
        [-6, 12]
      ];
      for (let vi = 0; vi < region.length; vi++) {
        let [x, y] = region[vi];
        x *= size / 16;
        y *= size / 16;
        region[vi][0] = u[0] * x + u[1] * y + offsetX;
        region[vi][1] = v[0] * x + v[1] * y + offsetY;
      }
      convexes.push(region);
    }

    return new IceCrystal({
      engine,
      position,
      convexes,
      expansions: 1
    });
  }
  constructor(params) {
    super(params);
    this.engine = params.engine;
    const position = params.position || [0, 0];
    const angle = params.angle || 0;
    const convexes = params.convexes;
    const expansions = params.expansions || 0;
    const inTerrain = params.inTerrain;

    this.rawConvexes = convexes;
    this.inTerrain = inTerrain;
    this.expanded = 0;
    this.expansions = expansions;

    this.body = new Body({
      mass: inTerrain ? 0 : 100,
      isStatic: inTerrain,
      friction: 0.9,
      position: position,
      angle: angle
    });
    this.convexes = convexes.map(vertices => new Convex({
      vertices
    }));
    this.convexes.forEach(c => this.body.addShape(c));

    this.mesh = getThreeJsObjectForP2Body(this.body);

    this.syncMeshWithBody();
  }
  collisionHandler(engine, shapeId, otherBodyId, otherEntity, eq) {
    if (otherEntity instanceof EphemeralEntity) {
      return;
    }
    if (otherEntity.isTerrain && !this.inTerrain) {
      engine.removeEntity(this);
      const frozenEntity = new IceCrystal({
        position: this.body.position,
        angle: this.body.angle,
        convexes: this.rawConvexes,
        expansions: this.expansions - 1,
        inTerrain: true
      });
      engine.addEntity(frozenEntity);
    }
  }
  onHit() {
    const { engine } = this;
    engine.removeEntity(this);
  }
}
