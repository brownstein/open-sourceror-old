import { Body, Box, Convex } from "p2";
import BaseEntity from "./base";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";

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

    this.mesh = getThreeJsObjectForP2Body(this.body, false, "#000000", 1);
  }
}
