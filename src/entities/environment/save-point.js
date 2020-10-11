import { Body, Box } from "p2";
import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";
import requireRoom from "src/rooms/require-room";
import BaseEntity from "src/entities/base";
import { saveGame } from "src/redux/actions/save-state";

export default class SavePoint extends BaseEntity {
  static roomEntityNames = ["savePoint"];
  static roomInitializer(engine, obj, props, persistId, persistSnapshot) {
    const point = new SavePoint({
      position: {
        x: obj.x + obj.width / 2,
        y: obj.y + obj.height / 2
      },
      width: obj.width,
      height: obj.height,
    });
    engine.addEntity(point);
    return point;
  }

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

    this.mesh = getThreeJsObjectForP2Body(this.body);

    this.transitionToLevel = level;
  }
  async collisionHandler(engine, shapeId, otherBodyId, otherEntity) {
    if (otherEntity !== engine.controllingEntity) {
      return;
    }
    engine.store.dispatch(saveGame(engine));
  }
}
