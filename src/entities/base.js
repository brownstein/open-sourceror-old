export default class BaseEntity {
  constructor () {
    this.engine = null;
    this.mesh = null;
    this.body = null;
  }
  syncMeshWithBody(timeDelta) {
    if (!this.mesh || !this.body) {
      return;
    }
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
}
