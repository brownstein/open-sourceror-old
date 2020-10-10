import {
  Color,
  Vector3,
  Mesh,
  Geometry,
  MeshBasicMaterial,
  DoubleSide
} from "three";

import {
  Box,
  Body,
  vec2
} from "p2";

import { castToVec2 } from "src/p2-utils/vec2-utils";
import getThreeJsObjectForP2Body from "src/p2-utils/get-threejs-mesh";

import BaseEntity from "src/entities/base";

export class DoorSpawn extends BaseEntity {
  static roomEntityNames = ["door"];
  static roomInitializer(engine, obj, props) {
    const door = new DoorSpawn({
      position: [
        obj.x + obj.width / 2,
        obj.y + obj.height / 2
      ],
      width: obj.width,
      heigth: obj.height
    });
    engine.addEntity(door);
    return door;
  }

  constructor(props) {
    super(props);
    const position = castToVec2(props.position);
    const width = props.width || 64;
    const height = props.height || 64;

    this.body = new Body({
      position,
      mass: 1,
      gravityScale: 0
    });

    this.sensor = new Box({
      width,
      height,
      sensor: true
    });

    this.body.addShape(this.sensor);
    this.mesh = getThreeJsObjectForP2Body(this.body, false);
    this.removed = false;
  }
  collisionHandler(engine, shapeId, otherBodyId, otherEntity) {
    if (!this.removed && otherEntity.isVerticalDoor) {
      this.removed = true;
      const verticalDoorBBox = otherEntity.body.aabb;
      const verticalDoorCenter = vec2.create();
      vec2.copy(verticalDoorCenter, verticalDoorBBox.upperBound);
      vec2.add(verticalDoorCenter, verticalDoorCenter, verticalDoorBBox.lowerBound);
      vec2.scale(verticalDoorCenter, verticalDoorCenter, 0.5);
      const verticalDoorBounds = vec2.create();
      vec2.copy(verticalDoorBounds, verticalDoorBBox.upperBound);
      vec2.sub(verticalDoorBounds, verticalDoorBounds, verticalDoorBBox.lowerBound);

      const DoorClass = chooseDoorClass(null);
      const door = new DoorClass({
        position: verticalDoorCenter,
        width: verticalDoorBounds[0],
        height: verticalDoorBounds[1],
        terrainEntity: otherEntity
      });
      engine.addEntity(door);
      engine.removeEntity(this);
      this.removed = true;
    }
  }
}

function chooseDoorClass(doorCondition) {
  switch (doorCondition) {
    default:
      return AutomaticDoor;
  }
}

export class Door extends BaseEntity {
  constructor(props) {
    super(props);
    const position = castToVec2(props.position);
    const width = props.width;
    const height = props.height;
    this.terrainEntity = props.terrainEntity;

    this.body = new Body({
      position,
      mass: 1,
      gravityScale: 0
    });

    this.sensor = new Box({
      width: width + 64,
      height,
      sensor: true
    });

    this.body.addShape(this.sensor);
    this.mesh = getThreeJsObjectForP2Body(this.body, false);

    this.width = width;
    this.height = height;

    this.isOpen = false;
    this.initialDoorPosition = this.terrainEntity.body.position;
  }
  open() {
    if (this.isOpen) {
      return;
    }
    this.isOpen = true;
    this.terrainEntity.body.position[1] += this.height;
  }
  close() {
    if (!this.isOpen) {
      return;
    }
    this.isOpen = false;
    this.terrainEntity.body.position[1] -= this.height;
  }
}

export class AutomaticDoor extends Door {
  constructor(props) {
    super(props);
    this.collidingWithPlayer = false;
  }
  collisionHandler(engine, shapeId, otherBodyId, otherEntity) {
    if (otherEntity !== engine.controllingEntity) {
      return;
    }
    this.collidingWithPlayer = true;
    this.open();
  }
  endCollisionHandler(engine, shapeId, otherBodyId, otherEntity) {
    if (!this.collidingWithPlayer) {
      return;
    }
    if (otherEntity !== engine.controllingEntity) {
      return;
    }
    this.close();
  }
}
