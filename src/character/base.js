import { Body, Convex, Material } from "p2";
import getThreeJsObjectForP2Body from "../p2-utils/get-threejs-mesh";

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
      vertices: [
        [-18, 10],
        [-20, 6],
        [0, -10],
        [20, 6],
        [18, 10]
      ]
    });
    convex.material = new Material();
    this.body.addShape(convex, [0, 4]);
    console.log(this.body);
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
