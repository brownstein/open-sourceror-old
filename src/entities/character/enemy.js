import { Character } from "./base";

export class Enemy extends Character {
  constructor(props) {
    super(props);
    this.i = Math.random() * 100 * Math.PI;
  }
  onFrame () {
    this.i++;
    const accellerationX = Math.cos(this.i / 100) * 20;
    this.plannedAccelleration[0] = accellerationX;
    if (this.i % 150 < 1) {
      this.plannedAccelleration[1] = -400;
    }
    super.onFrame();
  }
}
