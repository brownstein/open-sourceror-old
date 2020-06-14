import {
  Color,
  DoubleSide,
  FontLoader,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RawShaderMaterial,
  ShapeBufferGeometry,
  TextureLoader
} from "three";
import createTextGeometry from "three-bmfont-text";
import loadBMFont from "load-bmfont/browser";
import SDFShader from 'three-bmfont-text/shaders/sdf';

import { castToVector3 } from "src/p2-utils/vec2-utils";

import robotoFnt from "src/fonts/sdf/roboto-regular.fnt";
import robotoPng from "src/fonts/sdf/roboto-regular.png";

import robotoRegular from "src/fonts/json/roboto-regular.json";

export class BackgroundText {
  constructor(props) {
    const position = castToVector3(props.position);
    const text = props.text || "[]";
    const textSize = props.size || 12;

    this.text = text;
    this.textSize = textSize;
    this.textureLoader = new TextureLoader();

    this.mesh = new Object3D();
    this.mesh.position.copy(position);
    this.mesh.position.z = -10;
    this.readyPromise = this._init();
  }
  async _init() {
    this.texture = await this.textureLoader.loadAsync(robotoPng);
    this.font = await new Promise((resolve, reject) =>
      loadBMFont(robotoFnt, (err, fnt) => (err ? reject(err) : resolve(fnt)))
    );
    this.geometry = createTextGeometry({
      align: "center",
      font: this.font
    });
    this.geometry.update(this.text);
    const material = new RawShaderMaterial(SDFShader({
      map: this.texture,
      transparent: true,
      color: 0xffffff,
      side: DoubleSide
    }));
    const outlineMaterial = new RawShaderMaterial(SDFShader({
      map: this.texture,
      transparent: true,
      opacity: 0.25,
      color: 0x444444,
      side: DoubleSide
    }));

    const mesh = new Mesh(this.geometry, material);
    mesh.scale.multiplyScalar(0.5);
    this.mesh.add(mesh);

    // add outlines for visibility
    for (let i = 0; i < 8; i++) {
      const om = new Mesh(this.geometry, outlineMaterial);
      om.position.x += Math.cos(i * Math.PI / 4);
      om.position.y += Math.sin(i * Math.PI / 4);
      om.position.z = -1;
      om.scale.multiplyScalar(0.5);
      this.mesh.add(om);
    }
  }
}
