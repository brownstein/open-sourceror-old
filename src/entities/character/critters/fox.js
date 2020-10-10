import {
  Body,
  Circle,
  Convex,
  Ray,
  RaycastResult,
  vec2
} from "p2";

import BaseEntity from "src/entities/base";

export class Fox extends BaseEntity {
  static roomEntityNames = ["foxStart"];
  static roomInitializer(engine, obj, props) {
    const fox = new Fox({
      position: [obj.x, obj.y]
    });
    engine.addEntity(fox);
    return fox;
  }

  constructor(props) {
    super(props);

    this.body = new Body({
      mass: 20,
      damping: 0.1,
      friction: 0.9,
      fixedRotation: true,
      position: props.position,
      allowSleep: true
    });

    const foxBox = new Box({
      width: 32,
      height: 32
    });

    // assign collision mask to the box
    // convex.collisionGroup = 0b11;
    // convex.collisionMask = 0b01;

    this.body.add(foxBox);

    this.jumping = false;
    this.runningRight = false;
  }
}
