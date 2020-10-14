import {
  Color,
  DoubleSide,
  FontLoader,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  RawShaderMaterial,
  ShapeBufferGeometry,
  TextureLoader,
  Vector3
} from "three";
import createTextGeometry from "three-bmfont-text";
import loadBMFont from "load-bmfont/browser";
import SDFShader from 'three-bmfont-text/shaders/sdf';

import { castToVector3 } from "src/p2-utils/vec2-utils";

import robotoFnt from "src/fonts/sdf/roboto-regular.fnt";
import robotoPng from "src/fonts/sdf/roboto-regular.png";

export class BackgroundText {
  static roomEntityNames=["backgroundText", "foregroundText"];
  static roomInitializer(engine, obj, props) {
    if (obj.type === "backgroundText") {
      const text = new BackgroundText({
        position: obj,
        text: obj.text.text,
        size: obj.text.pixelsize,
        color: obj.text.color || "#000000",
        outline: !!obj.text.color
      });
      engine.addEntity(text);
      return text;
    }
    else {
      const text = new BackgroundText({
        position: obj,
        text: obj.text.text,
        size: obj.text.pixelsize,
        color: obj.text.color,
        z: 2
      });
      engine.addEntity(text);
      return text;
    }
  }

  constructor(props) {
    const position = castToVector3(props.position);
    const text = props.text || "[]";
    const textSize = props.size || 12;
    const textAlign = props.align || "center";
    const textColor = props.color || "#ffffff";
    const addOutline = props.outline !== undefined ? props.outline : true;
    const textOutlineColor = props.outlineColor || "#444444";
    const z = props.z || -1;

    this.text = text;
    this.textAlign = textAlign;
    this.textColor = textColor;
    this.textOutlineColor = textOutlineColor;
    this.textSize = textSize;
    this.addOutline = addOutline;
    this.textureLoader = new TextureLoader();

    this.fontFnt = robotoFnt;
    this.fontPng = robotoPng;
    this.fontScale = this.textSize / 32;

    this.mesh = new Object3D();
    this.mesh.position.copy(position);
    this.mesh.position.z = z;

    this.readyPromise = this._init();
  }
  async _init() {
    this.texture = await this.textureLoader.loadAsync(this.fontPng);
    this.font = await new Promise((resolve, reject) =>
      loadBMFont(this.fontFnt, (err, fnt) => (err ? reject(err) : resolve(fnt)))
    );
    this.geometry = createTextGeometry({
      align: this.textAlign,
      font: this.font
    });
    this.geometry.update(this.text);

    // something's up with the text positioning - still trying to figure
    // out exactly what
    const bboxSize = new Vector3();
    this.geometry.computeBoundingBox();
    this.geometry.boundingBox.getSize(bboxSize);
    this.mesh.position.y += bboxSize.y / 2;
    // this.mesh.position.x += bboxSize.x / 2;

    const material = new RawShaderMaterial(SDFShader({
      map: this.texture,
      transparent: true,
      color: this.textColor,
      side: DoubleSide
    }));

    // add primary text mesh
    const mesh = new Mesh(this.geometry, material);
    mesh.scale.multiplyScalar(this.fontScale);
    this.mesh.add(mesh);

    // add outlines for visibility
    if (this.addOutline) {
      const outlineMaterial = new RawShaderMaterial(SDFShader({
        map: this.texture,
        transparent: true,
        opacity: 0.25,
        color: this.textOutlineColor,
        side: DoubleSide
      }));

      for (let i = 0; i < 8; i++) {
        const outlineMesh = new Mesh(this.geometry, outlineMaterial);
        outlineMesh.position.x += Math.cos(i * Math.PI / 4);
        outlineMesh.position.y += Math.sin(i * Math.PI / 4);
        outlineMesh.position.z = -1;
        outlineMesh.scale.multiplyScalar(this.fontScale);
        this.mesh.add(outlineMesh);
      }
    }
  }
}
