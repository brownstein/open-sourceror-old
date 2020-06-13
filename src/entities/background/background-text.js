import {
  Color,
  DoubleSide,
  FontLoader,
  Mesh,
  MeshBasicMaterial,
  Object3D,
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
    this.material1 = new MeshBasicMaterial({
      color: new Color("#ffffff"),
      side: DoubleSide
    });
    this.material2 = new MeshBasicMaterial({
      color: new Color("#444444"),
      side: DoubleSide
    });

    this.mesh = new Object3D();
    const mainMesh = new Mesh(this.geometry, this.material1);
    const secondMesh = new Mesh(this.geometry, this.material2);
    this.mesh.add(mainMesh);
    this.mesh.add(secondMesh);
    mainMesh.rotation.x = Math.PI;
    secondMesh.rotation.x = Math.PI;
    secondMesh.position.x = 1;
    secondMesh.position.y = 1;
    secondMesh.position.z = -1;

    this.mesh.position.copy(position);
  }
}
