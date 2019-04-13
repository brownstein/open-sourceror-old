import { createTextWithFont } from "./text";

const CIRCLE_ELEMENT_PADDING = 4;
const CIRCLE_CHARACTER_SPACING = 0.5;
const CIRCLE_CHARACTER_SPACE_WIDTH = 15;
const CIRCLE_ELEMENT_RADIAL_PADDING = 30;

/**
 * This represents a group of elements laid out next to one another along the
 * curvature of a circle.
 */
export class CircleGroupSlice {
  constructor (children = []) {
    this.children = children;
    this.radius = 1;
    this.scale = 1;
    this.totalWidthInRadians = 0;
    this.childSpacing = CIRCLE_ELEMENT_PADDING;
  }
  addChildSlice (slice) {
    this.children.push(slice);
  }
  runLayout (radius = 1, scale = 1) {
    this.radius = radius;
    this.scale = scale;
    this.totalWidthInRadians = 0;
    this.children.forEach((childElement) => {
      this.totalWidthInRadians += childElement.runLayout(radius, scale);
      this.totalWidthInRadians += this.childSpacing * this.scale / this.radius;
    });
    return this.totalWidthInRadians;
  }
  addMeshesToContainer (container, startTheta = 0) {
    let theta = startTheta + this.childSpacing * this.scale / this.radius;
    this.children.forEach((childElement) => {
      childElement.addMeshesToContainer(container, theta);
      theta += childElement.totalWidthInRadians;
      theta += this.childSpacing * this.scale / this.radius;
    });
  }
}

/**
 * This represents a group of stacked elements laid out on top of one another.
 */
export class CircleStackSlice {
  constructor (children = []) {
    this.children = children;
    this.radius = 1;
    this.scale = 1;
    this.totalWidthInRadians = 0;
    this.radiusSpacing = CIRCLE_ELEMENT_RADIAL_PADDING;
  }
  runLayout (radius = 1, scale = 1) {
    this.radius = radius;
    this.scale = scale;
    let childRadius = radius;
    let maxWidthInRadians = 0;
    this.children.forEach(childElement => {
      maxWidthInRadians = Math.max(
        maxWidthInRadians,
        childElement.runLayout(childRadius, scale)
      );
      childRadius += this.radiusSpacing * this.scale;
    });
    this.totalWidthInRadians = maxWidthInRadians;
    return this.totalWidthInRadians;
  }
  addMeshesToContainer (container, startTheta = 0) {
    if (!this.totalWidthInRadians) {
      this.calculateWidthInRadians();
    }
    const midpointTheta = startTheta + this.totalWidthInRadians / 2;
    this.children.forEach(childElement => {
      const childStartTheta = midpointTheta - childElement.totalWidthInRadians / 2;
      childElement.addMeshesToContainer(container, childStartTheta);
    });
  }
}

/**
 * This represents a piece of text laid out along the radius of a given circle
 * slice.
 */
export class CircleTextSlice {
  constructor (text, colorAndFont = {}) {
    this.text = text || "";
    this.textMeshes = [];
    this.scale = 1;
    this.radius = 1;
    this.totalMeshWidth = 0;
    this.totalWidthInRadians = 0;
    this.characterSpacing = CIRCLE_CHARACTER_SPACING;
    this.spaceWidth = CIRCLE_CHARACTER_SPACE_WIDTH;
    this.colorAndFont = colorAndFont;
  }
  setText (text) {
    this.text = text;
    this.textMeshes = [];
  }
  _buildMeshes () {
    for (let i = 0; i < this.text.length; i++) {
      const char = this.text[i];
      const mesh = createTextWithFont(char, this.colorAndFont);
      mesh.scale.multiplyScalar(this.scale);
      this.textMeshes.push(mesh);
      let layoutWidth = mesh.geometry.layout.width;
      if (char === " ") {
        layoutWidth = this.spaceWidth;
      }
      this.totalMeshWidth += layoutWidth * this.scale;
      if (i < this.text.length - 1) {
        this.totalMeshWidth += this.characterSpacing * this.scale;
      }
    };
  }
  runLayout (radius = 1, scale = 1) {
    this.radius = radius;
    this.scale = scale;
    if (!this.textMeshes.length) {
      this._buildMeshes();
    }
    this.totalWidthInRadians = this.totalMeshWidth / this.radius;
    return this.totalWidthInRadians;
  }
  addMeshesToContainer (container, startTheta = 0) {
    if (!this.textMeshes.length) {
      this._buildMeshes();
    }
    let theta = startTheta;
    this.textMeshes.map((mesh, i) => {
      const char = this.text[i];
      mesh.position.x = this.radius * Math.cos(theta);
      mesh.position.y = this.radius * Math.sin(theta);
      mesh.rotation.z = theta + Math.PI / 2;
      container.add(mesh);
      let layoutWidth = mesh.geometry.layout.width;
      if (char === " ") {
        layoutWidth = this.spaceWidth;
      }
      theta += layoutWidth * this.scale / this.radius;
      theta += this.characterSpacing * this.scale / this.radius;
    });
  }
}

/**
 * Calculates the ideal layout for a given parent circle slice
 */
export function runLayout (circleSlice) {
  let radius = 1;
  let totalWidthInRadians = circleSlice.runLayout(radius);
  for (let i = 0; i < 2; i++) {
    const radiusAdjustment = totalWidthInRadians / (Math.PI * 2);
    radius *= radiusAdjustment;
    totalWidthInRadians = circleSlice.runLayout(radius);
  }
}
