import delay from "delay";
import {
  Geometry,
  MeshBasicMaterial,
  TextureLoader,
  Mesh,
  Vector3,
  Object3D,
  Face3
} from "three";

export class RepeatingBackgroundImage {
  constructor(textureImage) {
    this.engine = null;

    this.fullHeight = false;
    this.wrapWidth = true;

    this.mesh = new Object3D();

    this.geometry = new Geometry();
    geometry.vertices.push(new Vector3(-1, -1, 0));
    geometry.vertices.push(new Vector3(1, -1, 0));
    geometry.vertices.push(new Vector3(1, 1, 0));
    geometry.vertices.push(new Vector3(-1, 1, 0));
    geometry.faces.push(new Face3(0, 1, 2));
    geometry.faces.push(new Face3(0, 2, 3));
    geometry.faceVertexUvs[0].push([
      new Vector2(0, 1),
      new Vector2(1, 1),
      new Vector2(0, 0)
    ]);
    geometry.faceVertexUvs[0].push([
      new Vector2(0, 1),
      new Vector2(0, 0),
      new Vector2(1, 0)
    ]);

    const textureLoader = new TextureLoader();
    let texture;
    this.readyPromise = new Promise((resolve, reject) => {
      texture = textureLoader.load(textureImage, resolve, null, reject);
    });
    this.material = new Material({
      map: texture,
      transparent: true
    });

    this.ready = false;
    this.readyPromise.then(() => this.ready = true);
  }
  updateForScreenBBox() {
    const engine = this.engine;
    const levelBBox = engine.levelBBox;
  }
}
