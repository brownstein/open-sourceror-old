import { Body, Convex, Material, vec2 } from "p2";
import getThreeJsObjectForP2Body from "../p2-utils/get-threejs-mesh";

import characterPolygon from "./base.json";

export class Character {
  constructor () {
    this.body = new Body({
      mass: 20,
      damping: 0.1,
      friction: 0.9,
      fixedRotation: true,
      position: [200 + Math.random() * 200, -Math.random() * 100]
    });
    const convex = new Convex({
      vertices: characterPolygon.vertices
    });
    convex.material = new Material();

    // find center of mass for convex vertices
    const cm = vec2.create();
    for(let j = 0; j !== convex.vertices.length; j++){
      const v = convex.vertices[j];
      vec2.sub(v, v, convex.centerOfMass);
    }
    vec2.scale(cm, convex.centerOfMass, 1);

    // add the convex
    this.body.addShape(convex, cm);
    this.mesh = getThreeJsObjectForP2Body(this.body);
    this.onSurface = false;
    this.accellerationX = 50;
    this.maxVelocityX = 200;
  }
  runKeyboardMotion (ks) {
    if (ks.isKeyDown("d")) {
      let maxVDelta = this.maxVelocityX - this.body.velocity[0];
      if (maxVDelta < 0) {
        maxVDelta = 0;
      }
      const vDelta = Math.min(this.accellerationX, maxVDelta);
      this.body.velocity[0] += vDelta;
    }
    if (ks.isKeyDown("a")) {
      let maxVDelta = this.maxVelocityX + this.body.velocity[0];
      if (maxVDelta < 0) {
        maxVDelta = 0;
      }
      const vDelta = -Math.min(this.accellerationX, maxVDelta);
      this.body.velocity[0] += vDelta;
    }
    if (ks.isKeyDown("w")) {
      if (this.onSurface) {
        this.body.velocity[1] = -400;
      }
    }
    if (ks.isKeyDown("s")) {
      let maxVDelta = 200 - this.body.velocity[1];
      if (maxVDelta < 0) {
        maxVDelta = 0;
      }
      const vDelta = Math.min(20, maxVDelta);
      this.body.velocity[1] += vDelta;
    }
  }
  syncMeshWithBody () {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
  onFrame () {
    this.onSurface = false;
  }
  handleContactEquation (eq, otherEntity) {
    let surfaceNormal;
    if (eq.bodyA === this.body) {
      surfaceNormal = eq.normalA;
    }
    else {
      surfaceNormal = [-eq.normalA[0], -eq.normalA[1]];
    }
    this.onSurface = surfaceNormal[1] > 0.3;
  }
}
