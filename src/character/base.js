import { Body, Convex } from "p2";
import getThreeJsObjectForP2Body from "../p2-utils/get-threejs-mesh";

export class Character {
  constructor () {
    this.body = new Body({
      mass: 20,
      damping: 0.5,
      fixedRotation: true
    });
    const convex = new Convex({
      vertices: [
        [-10, 10],
        [0, -10],
        [10, 10]
      ]
    });
    this.body.addShape(convex);
    console.log(this.body);
    this.mesh = getThreeJsObjectForP2Body(this.body);
  }
  runKeyboardMotion (ks) {
    if (ks.isKeyDown("d")) {
      this.body.velocity[0] = 100;
    }
    if (ks.isKeyDown("a")) {
      this.body.velocity[0] = -100;
    }
    if (ks.isKeyDown("w")) {
      this.body.velocity[1] = -100;
    }
    if (ks.isKeyDown("s")) {

    }
  }
  syncMeshWithBody () {
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
}
