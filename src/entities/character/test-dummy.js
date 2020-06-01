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
    this.pathPlanStep = 0;

    this.cBBox = new CollisionBBox(16, 32);
  }
  _executeJumpPlan() {
    if (this.jumpPlan) {
      if (this.jumpPlanStep === 0) {
        const step = this.jumpPlan[0];
        this.plannedAccelleration[0] = step.vx;
        this.plannedAccelleration[1] = step.vy;
      }
      else if (this.jumpPlanStep < this.jumpPlan.length - 1) {
        const step = this.jumpPlan[this.jumpPlanStep];
        const nextStep = this.jumpPlan[this.jumpPlanStep + 1];
        // this.plannedAccelleration[0] = step.x - this.body.position[0];
        this.plannedAccelleration[0] = step.vx - this.body.velocity[0];
        // this.plannedAccelleration[1] = 0;
      }
      this.jumpPlanStep++;
    }
  }
  _executePathPlan() {
    this.cBBox.x = this.body.position[0];
    this.cBBox.y = this.body.position[1];
    if (this.pathPlan && (this.pathPlanStep < this.pathPlan.length)) {
      let planStep = this.pathPlan[this.pathPlanStep];
      for (let psi = 3; psi >= 0; psi--) {
        const nextPlanStep = this.pathPlan[this.pathPlanStep + psi];
        if (!nextPlanStep) {
          continue;
        }
        if (this.cBBox.containsPoint(nextPlanStep)) {
          this.pathPlanStep += psi;
          planStep = nextPlanStep;
          break;
        }
      }
      if (this.cBBox.containsPoint(planStep)) {
        this.pathPlanStep++;
        if (this.pathPlanStep >= this.pathPlan.length) {
          return;
        }
        planStep = this.pathPlan[this.pathPlanStep];
      }
      const xDiff = planStep.x - this.body.position[0];
      this.plannedAccelleration[0] = xDiff * 60;
    }
  }
  onFrame() {
    const engine = this.engine;
    const ng2 = engine.ng2;
    const player = engine.controllingEntity;

    if ((this.i++ % 120)) {
      // this._executePathPlan();
      this._executeJumpPlan();
      super.onFrame();
      return;
    }

    const currentPos = this.body.position;
    const playerPos = player.body.position;

    this.jumpPlan = ng2.planJump2(
      { x: currentPos[0], y: currentPos[1] },
      { x: playerPos[0], y: playerPos[1] },
      { x: 16, y: 32 },
      this.accelleration[0],
      this.jumpAcceleration,
      engine.world.gravity[1]
    );

    console.log(this.jumpPlan);
    this.jumpPlanStep = 0;
    this._executeJumpPlan();

    // const apexTarget = 32;
    // const velocityTarget = -Math.sqrt(engine.world.gravity[1] * apexTarget * 2);
    // this.plannedAccelleration[1] = velocityTarget;

    // const jumpProps = [
    //   currentPos[0],
    //   currentPos[1],
    //   playerPos[0],
    //   playerPos[1],
    //   16, // width
    //   32, // height
    //   this.accelleration[0] / 60,
    //   this.jumpAcceleration / 60,
    //   engine.world.gravity[1] / (60 * 60)
    // ];

    // this.jumpPlan = ng2.planJump(...jumpProps);
    // this.jumpPlanStep = 0;

    /// this._executeJumpPlan();

    //this.pathPlan = ng2.planPath(...jumpProps);
    //this.pathPlanStep = 0;

    //this._executePathPlan();

    super.onFrame();
  }
}
