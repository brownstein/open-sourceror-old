import * as THREE from "three";
const {
  Vector3,
  Face3,
  Geometry,
  Mesh,
  DoubleSide,
  ShaderMaterial,
  Color,
  Scene
} = THREE;
const Line2DGeometry = require("three-line-2d")(THREE);
const Line2DShader = require('three-line-2d/shaders/basic')(THREE);
const hash = require("hashcode").hashCode();
import { createText, createRunicText } from "./text";

/**
 * Helper class to make dealing with slices of circles easier
 */
export class CircleSlice {
  constructor ({
    startTheta = 0,
    endTheta = Math.PI * 2,
    radius = 10,
    thickness = 1,
    resolution = 32,
    color = "#ffffff",
    layoutPriority = 1
  } = {}) {
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.radius = radius;
    this.thickness = thickness;
    this.resolution = resolution;
    this.color = color;
    this.children = [];
    this.layoutPriority = layoutPriority;
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

/**
 * Helper class to make dealing with symbols and text easier
 */
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
    const meshContainer = new Scene();
    if (center) {
      textMesh.geometry.computeBoundingBox();
      const textBbox = textMesh.geometry.boundingBox;
      const textBboxSize = new Vector3();
      textBbox.getSize(textBboxSize);
      textMesh.position.x = -textBboxSize.x / 2;
      textMesh.position.y = textBboxSize.y / 2;
    }
    meshContainer.add(textMesh);
    return meshContainer;
  }
}

/**
 * Helper class to allow text to occupy circle slices
 */
export class SymbolTextCircleSlice {
  constructor ({
    text = "test",
    startTheta = 0,
    endTheta = Math.PI * 2,
    radius = 10,
    color = "0xffffff",
    runic = true,
    layoutPriority = 1
  } = {}) {
    this.text = text;
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.radius = radius;
    this.color = color;
    this.runic = runic;
    this.layoutPriority = layoutPriority;
  }
  createMesh () {

  }
}

/**
 * Configures a given set of circle slices to fit into a given circle slice
 */
export function applyCircularLayout (slices, startTheta, endTheta) {
  
}
