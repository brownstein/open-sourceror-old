import {
  Body,
  Circle,
  Convex,
  Ray,
  RaycastResult,
  vec2
} from "p2";
import { Vector2 } from "three";

import getThreeJsObjectForP2Body from "p2-utils/get-threejs-mesh";
import { CollisionBBox } from "src/utils/grid-to-navnodes-2";
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

    this.jumpAcceleration = 500;
    this.maxControlledVelocity = [200, 250];

    this.framesAfterLastPlan = Math.floor(Math.random() * 30);;

    this.jumpPlan = null;
    this.jumpPlanStep = 0;

    this.pathPlan = null;
    this.pathPlanState = null;
    this.pathPlanStep = null;

    this.waypointTestBBox = new CollisionBBox(16, 32);
  }
  onFrame() {
    // find path
    const engine = this.engine;
    const navGrid = engine.navGrid;

    this.invTimer = Math.max(0, this.invTimer - 1);

    const myPosition = this.body.position;
    const playerPosition = engine.controllingEntity.body.position;

    if ((this.framesAfterLastPlan++ > 60) && this.onSurface) {
      this.framesAfterLastPlan = 0;
      this.pathPlanStep = 0;
      this.pathPlan = navGrid.planPath(
        { x: myPosition[0], y: myPosition[1] },
        { x: playerPosition[0], y: playerPosition[1] },
        { x: 16, y: 32 },
        10, // this.maxControlledVelocity[0],
        this.accelleration[0],
        this.jumpAcceleration,
        engine.world.gravity[1] * 1.25, // add a little buffer
      );
    }

    this._executePathPlan();
    Character.prototype.onFrame.apply(this);
  }
  _executeJumpPlan() {
    if (!this.jumpPlan) {
      return false;
    }
    if (this.jumpPlanStep === 0) {
      const step = this.jumpPlan[0];
      this.plannedAccelleration[0] = (
        (step.vx - this.body.velocity[0]) +
        (step.x - this.body.position.x)
      ) * 0.5;
      this.plannedAccelleration[1] = step.vy - this.body.velocity[1];
      this.jumpPlanStep++;
      return true;
    }
    if (this.jumpPlanStep >= this.jumpPlan.length) {
      this.jumpPlan = null;
      return false;
    }
    const step = this.jumpPlan[this.jumpPlanStep++];
    this.plannedAccelleration[0] = step.vx - this.body.velocity[0];
    return true;
  }
  _executePathPlan() {
    const { engine } = this;
    const { world } = engine;

    if (this._executeJumpPlan()) {
      return;
    }
    if (!this.pathPlan) {
      return false;
    }
    if (this.pathPlanStep >= this.pathPlan.length) {
      return false;
    }

    this.waypointTestBBox.x = this.body.position[0];
    this.waypointTestBBox.y = this.body.position[1];

    // for the first step, just seek the waypoint
    if (this.pathPlanStep === 0) {
      const planStep = this.pathPlan[0];
      if (this.waypointTestBBox.containsPoint(planStep)) {
        this.pathPlanStep++;
      }
      const xDiff = planStep.x - this.body.position[0];
      this.plannedAccelleration[0] = xDiff * 60 - this.body.velocity[0];
      return;
    }

    // for all subsequent steps, check to see if we're between the waypoints
    // and use that logic as the basis for advancement
    const prevPlanStep = this.pathPlan[this.pathPlanStep - 1];
    const nextPlanStep = this.pathPlan[this.pathPlanStep];
    if (nextPlanStep.action !== "jump") {
      // detect whether we've finished the current step
      const prevPlanStep2 = new Vector2(prevPlanStep.x, prevPlanStep.y);
      const nextPlanStep2 = new Vector2(nextPlanStep.x, nextPlanStep.y);
      const currentPos2 = new Vector2(this.body.position[0], this.body.position[1]);
      const planStepVector = nextPlanStep2.clone().sub(prevPlanStep2).normalize();
      if (currentPos2.clone().sub(nextPlanStep2).dot(planStepVector) >= -0.1) {
        this.pathPlanStep++;
      }
      else if (this.waypointTestBBox.containsPoint(nextPlanStep)) {
        const nextNextPlanStep = this.pathPlan[this.pathPlanStep + 1];
        if (nextNextPlanStep && nextNextPlanStep.type !== "jump") {
          this.pathPlanStep++;
        }
      }
    }

    // advance to the current plan step
    const planStep = this.pathPlan[this.pathPlanStep];
    if (!planStep) {
      return;
    }

    // handle special cases for some actions (link jumping)
    switch (planStep.action) {
      // perform jump for jumps
      case "jump": {
        if (!this.onSurface) {
          if (this.jumpPlan) {
            const jumpPlanStep = this.jumpPlan[this.jumpPlan.length - 1];
            this.plannedAccelleration[0] = 0.5 * (
              jumpPlanStep.x - this.body.position[0]
            );
          }
          return false;
        }
        this.jumpPlan = planStep.actionPlan;
        this.jumpPlanStep = 0;
        this.pathPlanStep++;
        return this._executeJumpPlan();
      }
      // perform lookahead for falls
      case "fall":
      case "walk":
      {
        break;
        const nextPlanStep = this.pathPlan[this.pathPlanStep + 1];
        if (!nextPlanStep || nextPlanStep.type !== "walk") {
          break;
        }
        let hitAnything = false;
        const ray = new Ray({
          mode: Ray.ALL,
          from: vec2.clone(this.body.position),
          to: [nextPlanStep.x, nextPlanStep.y],
          callback: (result) => {
            if (result.body === null || result.body === this.body) {
              return;
            }
            hitAnything = true;
          }
        });
        const result = new RaycastResult();
        world.raycast(result, ray);

        if (!hitAnything) {
          pathPlanStep++
          planStep = nextPlanStep;
          break;
        }
      }
      default:
        break;
    }

    const xDiff = planStep.x - this.body.position[0];
    const yDiff = planStep.y - this.body.position[1];
    this.plannedAccelleration[0] = xDiff * 60 - this.body.velocity[0];
    if (yDiff > 0) {
      this.plannedAccelleration[1] = yDiff * 60 - this.body.velocity[1];
    }
  }
}
