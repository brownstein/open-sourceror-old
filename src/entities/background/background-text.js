import {
  Color,
  DoubleSide,
  FontLoader,
  Mesh,
  MeshBasicMaterial,
  ShapeBufferGeometry
} from "three";

import { castToVector3 } from "src/p2-utils/vec2-utils";

import robotoRegular from "src/fonts/json/roboto-regular.json";

export class BackgroundText {
  constructor(props) {
    const position = castToVector3(props.position);
    const text = props.text || "[]";
    const textSize = props.size || 12;

    this.fontJson = robotoRegular;
    this.fontLoader = new FontLoader();
    this.font = this.fontLoader.parse(this.fontJson);

    this.shape = this.font.generateShapes(text, 12);
    this.geometry = new ShapeBufferGeometry(this.shape, 4);
    this.material = new MeshBasicMaterial({
      color: new Color("#000000"),
      side: DoubleSide
    });

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.rotation.x = Math.PI;
    this.mesh.position.copy(position);
  }
}
