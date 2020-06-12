import {
  Body,
  Box
} from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import BaseEntity from "../base";

export default class BaseItem extends BaseEntity {
  static getInstance() {
    return null;
  }
  static getIcon() {
    return null;
  }
  constructor(props) {
    super(props);
    const { position, mass, size } = props;

    this.body = new Body({
      position: castToVec2(position),
      mass: mass || 20,
      fixedRotation: true
    });
    this.shape = new Box({
      width: size[0],
      height: size[1]
    });
    this.body.addShape(this.shape);
  }
}
