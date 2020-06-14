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

export class ConditionWall extends BaseEntity {
  constructor(params) {
    super(params);
    const {
      position,
      width,
      height
    } = params;

    this.body = new Body({
      mass: 0,
      position: castToVec2(position)
    });
    this.shape = new Box({
      width,
      height
    });
    this.body.addShape(this.shape);

    this.mesh = getThreeJsObjectForP2Body(this.body);
    this.syncMeshWithBody();

    this._onStoreUpdate = this._onStoreUpdate.bind(this);
    this.unsubscribe = null;
  }
  attachToEngine(engine) {
    this.unsubscribe = engine.store.subscribe(this._onStoreUpdate);
  }
  cleanup() {
    this.unsubscribe();
    this.unsubscribe = null;
  }
  _onStoreUpdate() {
    const { engine } = this;
    const state = engine.store.getState();
    const { scripts } = state;
    if (
      scripts.outputLines.length &&
      scripts.outputLines[scripts.outputLines.length - 1]
      .toLowerCase() === "hello world"
    ) {
      engine.removeEntity(this);
    }
  }
}
