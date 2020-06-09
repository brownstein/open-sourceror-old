import EventEmitter from "events";
import { vec2 } from "p2";

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
  attachToEngine(engine) {
    // sync mesh and body on engine attachment - many constructors fail to do
    // this, resulting in "jumping" objects
    if (!this.mesh || !this.body) {
      return;
    }
    this.mesh.position.x = this.body.position[0];
    this.mesh.position.y = this.body.position[1];
    this.mesh.rotation.z = this.body.angle;
    vec2.copy(this.body.interpolatedPosition, this.body.position);
    this.body.interpolatedAngle = this.body.angle;
  }
  syncMeshWithBody(timeDelta) {
    if (!this.mesh || !this.body) {
      return;
    }
    if (this.body.interpolatedPosition[0]) {
      this.mesh.position.x = this.body.interpolatedPosition[0];
      this.mesh.position.y = this.body.interpolatedPosition[1];
      this.mesh.rotation.z = this.body.interpolatedAngle;
    }
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
