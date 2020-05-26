import { Vector3 } from "three";

import "./dialogue.less";

export class DialogueEntity {
  constructor(position) {
    this.hoverPosition = new Vector3(position.x, position.y, 0);
    this.hoverElement = <div className="dialogue">
      <div>Hello World!</div>
      <div>Welcome to Open Sourceror.</div>
    </div>;
  }
}
