import { Ray, RaycastResult, vec2 } from "p2";
import { Vector2 } from "three";
import { CollisionBBox } from "src/utils/grid-to-navnodes-2";
import { Character } from "./base";

export class TestDummy extends Character {
  static _id = 1;
  constructor(props) {
    super(props);
    this.id = TestDummy._id++;
    this.i = Math.floor(Math.random() * 30);

    this.jumpAcceleration = 500;
    this.onSurface = true;

    this.jumpPlan = null;
    this.jumpPlanStep = 0;

    this.pathPlan = null;
    this.pathPlanState = null;
    this.pathPlanStep = 0;

    this.cBBox = new CollisionBBox(16, 32);
  }
  _executeJumpPlan() {
    if (!this.jumpPlan) {
      return false;
    }
    if (this.jumpPlanStep === 0) {
      const step = this.jumpPlan[0];
      //this.plannedAccelleration[0] = step.vx - this.body.velocity[0];
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

    this.cBBox.x = this.body.position[0];
    this.cBBox.y = this.body.position[1];

    // for the first step, just seek the waypoint
    if (this.pathPlanStep === 0) {
      const planStep = this.pathPlan[0];
      if (this.cBBox.containsPoint(planStep)) {
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
      else if (this.cBBox.containsPoint(nextPlanStep)) {
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
  onFrame() {
    const engine = this.engine;
    const nav = engine.navGrid;
    const player = engine.controllingEntity;

    if ((this.i++ % 60) || !this.onSurface) {
      this._executePathPlan();
      super.onFrame();
      return;
    }

    const currentPos = this.body.position;
    const playerPos = player.body.position;

    this.pathPlanStep = 0;
    this.pathPlan = nav.planPath(
      { x: currentPos[0], y: currentPos[1] },
      { x: playerPos[0], y: playerPos[1] },
      { x: 16, y: 32 },
      10, // this.maxControlledVelocity[0],
      this.accelleration[0],
      this.jumpAcceleration,
      engine.world.gravity[1] * 1.25, // add a little buffer
    );

    this.pathPlanStep = 0;
    this._executePathPlan();
    super.onFrame();
  }
}
