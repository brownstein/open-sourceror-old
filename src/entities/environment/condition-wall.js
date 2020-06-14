import {
  Color,
  Vector3,
  Mesh,
  BufferGeometry,
  MeshBasicMaterial,
  DoubleSide
} from "three";

import {
  Box,
  Body,
  vec2
} from "p2";

import { castToVec2 } from "src/p2-utils/vec2-utils";

import BaseEntity from "src/entities/base";

export function ConditionWall extends BaseEntity {
  constructor(params) {
    super(params);

    this.geometry = new BufferGeometry();

  }


}
