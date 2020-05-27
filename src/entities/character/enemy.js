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
      angularVelocity: srcBody.angularVelocity + (Math.random() - 0.5) * Math.PI
    });

    const srcConvex = srcBody.shapes[0];
    const convex = new Convex({
      angle: srcConvex.angle,
      axes: srcConvex.axes,
      vertices: srcConvex.vertices,
      material: srcConvex.material,
    });

    // convex.collisionMask = 0b100;
    this.convex = convex;

    this.body.addShape(convex, srcConvex.position, srcConvex.angle);
    this.body.allowSleep = true;
    this.body.sleepSpeedLimit = 1;
    this.body.sleepTimeLimit = 1;

    this.mesh = srcEnemy.mesh;
    this.mesh.children[0].material.opacity = 0.25;

    this.dead = true;

    this._possiblySleep = this._possiblySleep.bind(this);
    setTimeout(this._possiblySleep, 1000);
  }
  _possiblySleep() {
    if (this.body.sleepState === Body.SLEEPING) {
      this.convex.collisionMask = 0b100;
      return;
    }
    setTimeout(this._possiblySleep, 1000);
  }
}

export class SmartEnemy extends Enemy {
  constructor(props) {
    super(props);

    this.i = 0;
    this.movingDirectly = false;
    this.plannedPath = [];

    this.unstuckMode = false;
    this.lastLocation = null;
    this.recentMotion = 0;

    this.maxControlledVelocity = [100, 400];
  }
  onFrame() {
    // find path
    const engine = this.engine;
    const navGrid = engine.navGrid;

    const myPosition = this.body.position;
    const playerPosition = engine.controllingEntity.body.position;

    if (!(this.i++ % 30)) {
      // unstuck yourself
      if (this.plannedPath && this.recentMotion < 2) {
        this.unstuckMode = !this.onSurface;
      }
      else {
        this.unstuckMode = false;
      }

      this.plannedPath = navGrid.plotPath(
        myPosition[0],
        myPosition[1],
        playerPosition[0],
        playerPosition[1]
      );

      this.recentMotion = 0;
    }

    if (this.plannedPath) {
      let nextPathNode = null;
      if (this.plannedPath && this.plannedPath.length) {
        nextPathNode = this.plannedPath[0];
        if (nextPathNode.contains(myPosition[0], myPosition[1])) {
          this.plannedPath.shift();
          nextPathNode = this.plannedPath[0];
        }
      }
      if (!nextPathNode) {
        this.movingDirectly = true;
      }
      else {
        const nodeCenter = nextPathNode.getCenter();
        this.plannedAccelleration[0] = nodeCenter[0] - myPosition[0];
        this.plannedAccelleration[1] = nodeCenter[1] < myPosition[1] ?
          -400 :
          0;
        this.movingDirectly = false;
      }
    }

    if (this.movingDirectly) {
      this.plannedAccelleration[0] = playerPosition[0] - myPosition[0];
      this.plannedAccelleration[1] = playerPosition[1] < myPosition[1] ?
        -400 :
        0;
    }

    if (this.unstuckMode) {
      this.plannedAccelleration[1] = 50;
    }

    Character.prototype.onFrame.apply(this);

    this.invTimer = Math.max(0, this.invTimer - 1);

    if (this.lastLocation) {
      const dx = this.body.position[0] - this.lastLocation[0];
      const dy = this.body.position[1] - this.lastLocation[1];
      this.recentMotion += Math.sqrt(dx * dx + dy * dy);
    }
  }
}
