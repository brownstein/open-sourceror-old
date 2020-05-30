import { Character } from "./base";

export class TestDummy extends Character {
  static _id = 1;
  constructor(props) {
    super(props);
    this.id = TestDummy._id++;
    this.i = 0;
  }
  onFrame() {
    const engine = this.engine;
    const ng2 = engine.ng2;
    const player = engine.controllingEntity;

    if (this.id !== 1) {
      return;
    }
    if (this.i++ % 100 !== 0) {
      return;
    }

    
  }
}
