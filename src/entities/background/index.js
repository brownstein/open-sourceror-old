import delay from "delay";
import {
  Geometry,
  MeshBasicMaterial,
  TextureLoader,
  Mesh,
  Vector3,
  Object3D
} from "three";

export class RepeatingBackgroundImage {
  constructor() {
    this.mesh = new Object3D();
    this.ready = false;
    this.readyPromise = this._init();
  }
  async _init() {
    await delay(1000);
    this.ready = true;
  }
}
