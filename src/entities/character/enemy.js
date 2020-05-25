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
    }
  }
}
