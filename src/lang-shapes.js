import * as THREE from "three";
const {
  Vector3,
  Face3,
  Geometry,
  Mesh,
  DoubleSide,
  ShaderMaterial,
  Color,
  Object3D
} = THREE;
const Line2DGeometry = require("three-line-2d")(THREE);
const Line2DShader = require('three-line-2d/shaders/basic')(THREE);
const hash = require("hashcode").hashCode();
import { createText, createRunicText } from "./text";

export class CircleSlice {
  constructor ({
    startTheta = 0,
    endTheta = Math.PI * 2,
    radius = 10,
    thickness = 1,
    resolution = 32,
    color = "#ffffff"
  } = {}) {
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.radius = radius;
    this.thickness = thickness;
    this.resolution = resolution;
    this.color = color;
    this.children = [];
  }
  static fromCodeExpression () {
    return new CircleSlice();
  }
  createMesh () {
    const {
      resolution,
      startTheta,
      endTheta,
      radius,
      color,
      thickness
    } = this;
    let closed = false;
    let numPoints = Math.ceil(resolution * (endTheta - startTheta) / Math.PI * 2);
    let pointAngle = (endTheta - startTheta) / numPoints;
    if ((startTheta % (Math.PI * 2)) === (endTheta % (Math.PI * 2))) {
      closed = true;
      numPoints -= 1;
    }
    const points = [];
    for (let p = 0; p < numPoints; p++) {
      points.push([
        radius * Math.cos(startTheta + p * pointAngle),
        radius * Math.sin(startTheta + p * pointAngle)
      ]);
    }
    const geom = new Line2DGeometry(points, {
      distances: true,
      closed: closed
    });
    const material =  new ShaderMaterial(Line2DShader({
      side: DoubleSide,
      diffuse: color,
      thickness: thickness
    }));
    return new Mesh(geom, material);
  }
}

export class SymbolText {
  constructor ({
    value = "[Symbol]",
    runic = true,
    center = true,
    color = "#ffffff"
  } = {}) {
    this.value = value;
    this.runic = runic;
    this.center = center;
    this.color = color;
  }
  createMesh () {
    const {
      value,
      runic,
      center,
      color
    } = this;
    let textMesh;
    if (runic) {
      // hash into a single letter
      const hashValue = 65 + Math.abs((hash.value(value) % 57));
      textMesh = createRunicText(String.fromCharCode(hashValue), color);
    }
    else {
      textMesh = createText(value, color);
    }
    if (center) {
      textMesh.geometry.computeBoundingBox();
      const textBbox = textMesh.geometry.boundingBox;
      const textBboxSize = new Vector3();
      textBbox.getSize(textBboxSize);
      textBboxSize.multiplyScalar(0.5);
      textMesh.position.x = -textBboxSize.x / 2;
      textMesh.position.y = textBboxSize.y / 2;
      textMesh.scale.multiplyScalar(0.5);
    }
    return textMesh;
  }
}
