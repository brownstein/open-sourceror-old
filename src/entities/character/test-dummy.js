import { CollisionBBox, MovementCapabilities } from "src/utils/grid-to-navnodes-2";
import { Character } from "./base";

export class TestDummy extends Character {
  static _id = 1;
  constructor(props) {
    super(props);
    this.id = TestDummy._id++;
    this.i = 0;

    this.jumpAcceleration = 400;
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
      this.plannedAccelleration[0] = step.vx - this.body.velocity[0];
      this.plannedAccelleration[1] = step.vy;
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
    if (this._executeJumpPlan()) {
      return;
    }
    this.cBBox.x = this.body.position[0];
    this.cBBox.y = this.body.position[1];
    if (!this.pathPlan) {
      return false;
    }
    if (this.pathPlanStep >= this.pathPlan.length) {
      return false;
    }
    let planStep = this.pathPlan[this.pathPlanStep];
    for (let psi = 3; psi >= 0; psi--) {
      const nextPlanStep = this.pathPlan[this.pathPlanStep + psi];
      if (!nextPlanStep) {
        continue;
      }
      if (this.cBBox.containsPoint(nextPlanStep)) {
        this.pathPlanStep += psi + 1;
        planStep = nextPlanStep;
        break;
      }
    }

    switch (planStep.action) {
      case "jump":
        this.jumpPlan = planStep.actionPlan;
        this.jumpPlanStep = 0;
        return true;
      default:
        break;
    }

    const xDiff = planStep.x - this.body.position[0];
    this.plannedAccelleration[0] = xDiff * 60;
  }
  onFrame() {
    const engine = this.engine;
    const ng2 = engine.ng2;
    const player = engine.controllingEntity;

    if ((this.i++ % 60)) {
      this._executePathPlan();
      // this._executeJumpPlan();
      super.onFrame();
      return;
    }

    const currentPos = this.body.position;
    const playerPos = player.body.position;

    this.pathPlan = ng2.planPath(
      { x: currentPos[0], y: currentPos[1] },
      { x: playerPos[0], y: playerPos[1] },
      { x: 16, y: 32 },
      this.accelleration[0],
      this.jumpAcceleration,
      engine.world.gravity[1]
    );

    console.log(this.pathPlan);

    this.pathPlanStep = 0;
    this._executePathPlan();

    super.onFrame();
  }
}
