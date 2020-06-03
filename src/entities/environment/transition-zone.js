import { Body, Box } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import requireRoom from "src/rooms/require-room";
import BaseEntity from "src/entities/base";

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

    // this could be cleaner, also we need to dispatch some stuff to re-sync
    // redux with the next room
    const nextLevel = await requireRoom(this.transitionToLevel);
    engine.currentRoom.cleanup(engine);
    nextLevel.init(engine);
  }
}
