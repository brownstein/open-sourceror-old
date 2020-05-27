import { Body, Box } from "p2";

export default class RoomConstraint {
  constructor({ position, size }) {
    this.isEnvironmental = true;
    this.engine = null;
    this.body = new Body({
      position,
      isStatic: true,
      mass: 0
    });
    this.box = new Box({ width: size[0], height: size[1] });
    this.body.addShape(this.box);
  }
}
