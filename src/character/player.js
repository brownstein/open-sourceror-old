import { Character } from "./base";

export class Player extends Character {
  constructor() {
    super();
  }
  runKeyboardMotion (ks) {
    if (ks.isKeyDown("d")) {
      this.plannedAccelleration[0] = this.accelleration[0];
    }
    if (ks.isKeyDown("a")) {
      this.plannedAccelleration[0] = -this.accelleration[0];
    }
    if (ks.isKeyDown("w")) {
      this.plannedAccelleration[1] = -this.jumpAccelleration;
    }
    if (ks.isKeyDown("s")) {
      this.plannedAccelleration[1] = this.accelleration[1];
    }
  }
}
