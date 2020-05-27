import EventEmitter from "events";

export default class BaseEntity{
  static _id = 1;
  constructor () {
    this._id = BaseEntity._id++;
    this.engine = null;
    this.mesh = null;
    this.body = null;
    this.hoverPosition = null;
    this.hoverElement = null;
    this.events = null;
  }
  syncMeshWithBody(timeDelta) {
    if (!this.mesh || !this.body) {
      return;
    }
    this.mesh.position.x = this.body.interpolatedPosition[0];
    this.mesh.position.y = this.body.interpolatedPosition[1];
    this.mesh.rotation.z = this.body.interpolatedAngle;
  }
  on(eventName, callback) {
    if (this.events === null) {
      this.events = new EventEmitter();
    }
    this.events.on(eventName, callback);
  }
  off(eventName, callback) {
    if (this.events !== null) {
      this.events.off(eventName, callback);
    }
  }
  emit(eventName, contents) {
    if (this.events) {
      this.events.emit(eventName, contents);
    }
  }
}

export class EphemeralEntity extends BaseEntity {
  isEphemeral = true;
}
