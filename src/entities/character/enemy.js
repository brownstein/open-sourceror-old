import {
  Body,
  Circle,
  Convex,
  vec2
} from "p2";

import getThreeJsObjectForP2Body from "p2-utils/get-threejs-mesh";
import BaseEntity from "../base";
import { Character } from "./base";

export class Enemy extends Character {
  constructor(props) {
    super(props);
    this.i = Math.random() * 100 * Math.PI;
    this.health = 100;
    this.invTimer = 0;
  }
  onFrame() {
    this.i++;
    this.invTimer = Math.max(0, this.invTimer - 1);
    const accellerationX = Math.cos(this.i / 100) * 20;
    this.plannedAccelleration[0] = accellerationX;
    if (this.i % 150 < 1) {
      this.plannedAccelleration[1] = -400;
    }
    super.onFrame();
  }
  onHit() {
    if (this.invTimer > 0) {
      return;
    }
    this.health -= 10;
    this.invTimer = 2;
    if (this.health <= 0) {
      this.engine.removeEntity(this);
      this.engine.addEntity(new DeadEnemy(this));
    }
  }
}

export class DeadEnemy extends BaseEntity {
  constructor(srcEnemy) {
    super();
    const srcBody = srcEnemy.body;
    this.body = new Body({
      mass: 1,
      position: srcBody.interpolatedPosition,
      velocity: srcBody.velocity,
      angle: srcBody.angle,
      angularVelocity: (Math.random() - 0.5) * Math.PI * 5
    });

    const srcConvex = srcBody.shapes[0];
    const convex = new Convex({
      angle: srcConvex.angle,
      axes: srcConvex.axes,
      vertices: srcConvex.vertices,
      material: srcConvex.material,
    });

    // convex.collisionMask = 0b100;

    this.body.addShape(convex, srcConvex.position, srcConvex.angle);

    this.mesh = srcEnemy.mesh;
    this.mesh.children[0].material.opacity = 0.25;

    this.dead = true;
  }
}
