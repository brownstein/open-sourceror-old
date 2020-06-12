import { Object3D } from "three";
import { SimpleSprite } from "src/engine/sprites";
import scrollPNG from "./sprites/scroll.png";

import BaseItem from "./base";

export default class Scroll extends BaseItem {
  static getInstance(props) {
    return new Scroll(props);
  }
  static getIcon() {
    return new SimpleSprite(scrollPNG);
  }
  constructor(props) {
    super({
      position: props.position,
      size: [12, 12]
    });

    this.sprite = Scroll.getIcon();

    this.mesh = new Object3D();
    this.readyPromise = this.sprite.readyPromise;

    this.readyPromise.then(() => {
      this.mesh.add(this.sprite.mesh);
    });
  }
}
