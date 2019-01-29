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

class BaseSlice {
  createAllMeshes (...params) {
    const parentMesh = this.createMesh(...params);
    if (this.children) {
      this.children.forEach(child => {
        parentMesh.children.push(child.createAllMeshes());
      });
    }
    return parentMesh;
  }
}

/**
 * Helper class to make dealing with slices of circles easier
 */
export class CircleSlice extends BaseSlice {
  constructor ({
    startTheta = 0,
    endTheta = Math.PI * 2,
    radius = 10,
    thickness = 1,
    resolution = 32,
    color = "#ffffff",
    layoutPriority = 1
  } = {}) {
    super();
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
    if (
      ((startTheta + Math.PI * 2) % (Math.PI * 2)) ===
      ((endTheta + Math.PI * 2) % (Math.PI * 2))
    ) {
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
export class SymbolTextCircleSlice extends BaseSlice {
  constructor ({
    text = "test",
    startTheta = 0,
    endTheta = Math.PI * 2,
    radius = 10,
    color = "0xffffff",
    runic = true,
    layoutPriority = 0.2
  } = {}) {
    super();
    this.text = text;
    this.startTheta = startTheta;
    this.endTheta = endTheta;
    this.radius = radius;
    this.color = color;
    this.runic = runic;
    this.layoutPriority = layoutPriority;
    this.children = [];
  }
  createMesh () {
    if (this.runic) {
      const runicSymbol = new SymbolText({
        value: this.text,
        color: this.color
      });
      const runicMesh = runicSymbol.createMesh();
      const midTheta = (this.startTheta + this.endTheta) / 2;
      runicMesh.rotation.z = midTheta + Math.PI / 2;
      runicMesh.position.x = this.radius * Math.cos(midTheta);
      runicMesh.position.y = this.radius * Math.sin(midTheta);
      runicMesh.scale.multiplyScalar(0.5);
      return runicMesh;
    }
    throw new Error("only runic is currently supported");
  }
}

/**
 * Configures a given set of circle slices to fit into a given circle slice
 */
export function applyCircularLayout (slices, {
  startTheta = 0,
  endTheta = Math.PI * 2,
  margin = 0.1,
  radius = 10,
  radiusDelta = 10
} = {}) {
  if (slices.length === 0) {
    return;
  }
  if (slices.length === 1) {
    const slice = slices[0];
    slice.startTheta = startTheta;
    slice.endTheta = endTheta;
    slice.radius = radius;
    applyCircularLayout(slice.children, {
      startTheta: slice.startTheta,
      endTheta: slice.endTheta,
      radius: radius + radiusDelta,
      radiusDelta: radiusDelta
    });
    return;
  }
  let totalPriority = slices.reduce((p, s) => p + s.layoutPriority, 0);
  totalPriority += margin * slices.length;
  const thetaPerPriority = (endTheta - startTheta) / totalPriority;
  let theta = startTheta + margin * thetaPerPriority / 2;
  slices.forEach(slice => {
    slice.startTheta = theta;
    theta += slice.layoutPriority * thetaPerPriority;
    slice.endTheta = theta;
    theta += margin * thetaPerPriority;
    slice.radius = radius;
    applyCircularLayout(slice.children || [], {
      startTheta: slice.startTheta,
      endTheta: slice.endTheta,
      radius: radius + radiusDelta,
      radiusDelta: radiusDelta
    });
  });
}
