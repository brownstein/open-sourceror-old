import { Character } from "./base";

export class TestDummy extends Character {
  static _id = 1;
  constructor(props) {
    super(props);
    this.id = TestDummy._id++;
    this.i = 0;

    this.jumpPlan = null;
    this.jumpPlanStep = 0;
    this.jumpAccelleration = 400;
  }
  onFrame() {
    const engine = this.engine;
    const ng2 = engine.ng2;
    const player = engine.controllingEntity;

    if (this.jumpPlan) {
      if (this.jumpPlanStep === 0) {
        const step = this.jumpPlan[0];
        this.plannedAccelleration[0] = step.vx * 60;
        this.plannedAccelleration[1] = step.vy * 60;
      }
      else if (this.jumpPlanStep < this.jumpPlan.length - 1) {
        const step = this.jumpPlan[this.jumpPlanStep];
        const nextStep = this.jumpPlan[this.jumpPlanStep + 1];
        this.plannedAccelleration[0] = step.x - this.body.position[0];
        this.plannedAccelleration[1] = 0;
      }
      this.jumpPlanStep++;
    }

    if ((this.i++ % 60)) {
      super.onFrame();
      return;
    }

    const currentPos = this.body.position;
    const playerPos = player.body.position;

    const jumpProps = [
      currentPos[0],
      currentPos[1],
      playerPos[0],
      playerPos[1],
      16, // width
      32, // height
      this.accelleration[0] / 60,
      this.jumpAccelleration / 60,
      engine.world.gravity[1] / (60 * 60)
    ];

    // console.log(jumpProps);

    this.jumpPlan = ng2.planJump(...jumpProps);
    this.jumpPlanStep = 0;

    super.onFrame();
  }
}
