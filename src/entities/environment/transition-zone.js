import { Body, Box, vec2 } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import BaseEntity from "src/entities/base";
import { transitionToRoom } from "src/redux/actions/rooms";

export default class TransitionZone extends BaseEntity {
  static roomEntityNames = ["transitionZone", "room-transition"];
  static roomInitializer(engine, obj, props, persistId, persistSnapshot = null) {
    const nextRoom = props.room;
    const nextRoomDirection = props.direction;
    const zone = new TransitionZone({
      position: {
        x: obj.x + obj.width / 2,
        y: obj.y + obj.height / 2
      },
      width: obj.width,
      height: obj.height,
      level: nextRoom
    });
    engine.addEntity(zone);
    return zone;
  }

  constructor(props) {
    super(props);
    const position = castToVec2(props.position);
    const width = props.width;
    const height = props.height;
    const level = props.level;
    const spawnColliding = props.spawnColliding;

    this.isTransitionZone = true;
    this.spawnColliding = spawnColliding || false;

    this.body = new Body({
      position,
      mass: 0,
      isStatic: true
    });

    this.sensor = new Box({
      width,
      height,
      sensor: true
    });

    this.body.addShape(this.sensor);
    this.transitionToLevel = level;
  }
  async collisionHandler(engine, shapeId, otherBodyId, otherEntity) {
    if (otherEntity !== engine.controllingEntity) {
      return;
    }
    if (this.spawnColliding) {
      return;
    }

    const relativeEntityPosition = vec2.create();
    vec2.copy(relativeEntityPosition, otherEntity.body.position);
    vec2.sub(relativeEntityPosition, relativeEntityPosition, this.body.position);
    vec2.div(relativeEntityPosition, relativeEntityPosition, [
      this.sensor.width,
      this.sensor.height
    ]);

    engine.store.dispatch(transitionToRoom(
      this.transitionToLevel,
      relativeEntityPosition
    ));
  }
  endCollisionHandler(engine, shapeId, otherBodyId, otherEntity) {
    if (otherEntity !== engine.controllingEntity) {
      return;
    }
    this.spawnColliding = false;
  }
}
