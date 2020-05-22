import { Character } from "./base";

export class Enemy extends Character {
  constructor() {
    super();
    this.i = 0;
  }
  onFrame () {
    this.i++;
    const accellerationX = Math.cos(this.i / 100) * 40;
    this.plannedAccelleration[0] = accellerationX;
    if (!(this.i % 150)) {
      this.plannedAccelleration[1] = -400;
    }
    super.onFrame();
  }
}
