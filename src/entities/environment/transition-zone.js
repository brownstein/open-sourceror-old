import { Body, Box } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import BaseEntity from "src/entities/base";
import { transitionToRoom } from "src/redux/actions/rooms";

export default class TransitionZone extends BaseEntity {
  constructor(props) {
    super(props);
    const position = castToVec2(props.position);
    const width = props.width;
    const height = props.height;
    const level = props.level;

    this.body = new Body({
      position,
      mass: 0,
      isStatic: true
    });

    const sensor = new Box({
      width,
      height,
      sensor: true
    });

    this.body.addShape(sensor);
    this.transitionToLevel = level;
  }
  async collisionHandler(engine, shapeId, otherBodyId, otherEntity) {
    if (otherEntity !== engine.controllingEntity) {
      return;
    }

    engine.store.dispatch(transitionToRoom(this.transitionToLevel));
  }
}
