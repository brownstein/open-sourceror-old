import {
  DoubleSide,
  Face3,
  Geometry,
  Texture,
  TextureLoader,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  Vector2,
  Vector3,
} from "three";
import { Character } from "./base";
import {
  cycles as characterSpriteCycles,
  image as characterSpriteSheet
} from "../sprites/wizard";

export class Player extends Character {
  constructor() {
    super();
    const spriteGeom = new Geometry();
    spriteGeom.vertices.push(new Vector3(-8, -8, 0));
    spriteGeom.vertices.push(new Vector3(8, -8, 0));
    spriteGeom.vertices.push(new Vector3(8, 24, 0));
    spriteGeom.vertices.push(new Vector3(-8, 24, 0));
    spriteGeom.faces.push(new Face3(0, 1, 2));
    spriteGeom.faces.push(new Face3(0, 2, 3));
    const tx = new TextureLoader();
    const tex = tx.load(characterSpriteSheet, () => {
      console.log(tex.image.naturalWidth);
    });
    console.log(tex);
  }
  async loadTextures() {

  }
  syncMeshWithBody() {
    super.syncMeshWithBody();

  }
  runKeyboardMotion(ks) {
    if (ks.isKeyDown("d")) {
      this.plannedAccelleration[0] = this.accelleration[0];
    }
    if (ks.isKeyDown("a")) {
      this.plannedAccelleration[0] = -this.accelleration[0];
    }
    if (ks.isKeyDown("w")) {
      this.plannedAccelleration[1] = -this.jumpAccelleration;
    }
    if (ks.isKeyDown("s")) {
      this.plannedAccelleration[1] = this.accelleration[1];
    }
  }
}
