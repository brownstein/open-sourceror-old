export default class BaseEntity {
  static id = 1;
  constructor () {
    this._id = BaseEntity._id++;
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

export class EphemeralEntity extends BaseEntity {
  isEphemeral = true;
}
