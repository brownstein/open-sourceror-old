import {
  Box3,
  Color,
  DoubleSide,
  Face3,
  Geometry,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Object3D,
  TextureLoader,
  Vector2,
  Vector3,
} from "three";
import {
  Body,
  Convex,
  Material,
  vec2
} from "p2";
import getThreeJsObjectForP2Body from "./p2-utils/get-threejs-mesh";
import { traverseTileGrid } from "../grid-to-polygon";
import { loadTileset } from "../tileset-loader";

export const groundMaterial = new Material();

export class Terrain {
  constructor() {
    this.body = null;
    this.mesh = null;
  }
}

export class TilesetTerrain extends Terrain {
  constructor() {
    super();

  }
}
