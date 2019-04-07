import { createTextWithFont } from "./text";

const CIRCLE_ELEMENT_PADDING = 4;
const CIRCLE_CHARACTER_SPACING = 2;
const CIRCLE_ELEMENT_RADIAL_PADDING = 30;

export class CircleGroupSlice {
  constructor () {
    this.children = [];
    this.radius = 0;
    this.totalWidthInRadians = 0;
    this.childSpacing = CIRCLE_ELEMENT_PADDING;
  }
  addChildSlice (slice) {
    this.children.push(slice);
  }
  calculateWidthInRadians () {
    this.totalWidthInRadians = 0;
    this.children.map((childElement, i) => {
      childElement.radius = this.radius;
      childElement.calculateWidthInRadians();
      this.totalWidthInRadians += childElement.totalWidthInRadians;
      if (i < this.children.length - 1) {
        this.totalWidthInRadians += this.childSpacing;
      }
    });
    return this.totalWidthInRadians;
  }
  addMeshesToContainer (container, startTheta = 0) {

  }
}

export class CircleStackSlice {
  constructor () {
    this.children = [];
    this.radius = 0;
    this.totalWidthInRadians = 0;
    this.radiusSpacing = CIRCLE_ELEMENT_RADIAL_PADDING;
  }
  addChildSlice (slice) {
    this.children.push(slice);
  }
  calculateWidthInRadians () {
    let radius = this.radius;
    let maxWidthInRadians = 0;
    this.children.map((childElement, i) => {
      childElement.radius = radius;
      childElement.calculateWidthInRadians();
      maxWidthInRadians = Math.max(maxWidthInRadians, childElement.totalWidthInRadians);
      radius += this.radiusSpacing;
    });
    this.totalWidthInRadians = maxWidthInRadians;
    return this.totalWidthInRadians;
  }
  addMeshesToContainer (container, startTheta = 0) {
    if (!this.totalWidthInRadians) {
      this.calculateWidthInRadians();
    }
    const midpointTheta = startTheta + this.totalWidthInRadians / 2;
    this.children.map((childElement, i) => {
      const childStartTheta = midpointTheta - childElement.totalWidthInRadians / 2;
      childElement.addMeshesToContainer(container, childStartTheta);
    });
  }
}

export class CircleTextSlice {
  constructor () {
    this.text = "";
    this.textMeshes = [];
    this.scale = 1;
    this.radius = 0;
    this.totalMeshWidth = 0;
    this.totalWidthInRadians = 0;
    this.characterSpacing = CIRCLE_CHARACTER_SPACING;
  }
  _buildMeshes () {
    this.text.map((char, i) => {
      const mesh = createTextWithFont(char);
      mesh.scale.multiplyScalar(this.scale);
      this.textMeshes.push(mesh);
      this.totalMeshWidth += mesh.geometry.layout.width * this.scale;
      if (i < this.text.length - 1) {
        this.totalMeshWidth += this.characterSpacing * this.scale;
      }
    });
  }
  calculateWidthInRadians () {
    if (!this.text) {
      this._buildMeshes();
    }
    this.totalWidthInRadians = this.totalMeshWidth / this.radius;
    return this.totalWidthInRadians;
  }
  addMeshesToContainer (container, startTheta = 0) {
    if (!this.totalWidthInRadians) {
      this.calculateWidthInRadians();
    }
    let theta = startTheta;
    this.textMeshes.map((mesh, i) => {
      container.add(mesh);
      mesh.position.x = this.radius * Math.cos(theta);
      mesh.position.y = this.radius * Math.sin(theta);
      mesh.rotation.z = theta + Math.PI / 2;
      theta += this.characterSpacing * this.scale;
    });
  }
}
