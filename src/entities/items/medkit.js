import { Object3D } from "three";
import { SimpleSprite } from "src/engine/sprites";
import medkitPNG from "./sprites/medkit.png";

import BaseItem from "./base";

export default class Medkit extends BaseItem {
  static getInstance(props) {
    return new Medkit(props);
  }
  static getIcon() {
    return new SimpleSprite(medkitPNG);
  }

  static roomEntityNames = ["medkit"];
  static roomInitializer(engine, obj, props, persistId, persistSnapshot = null) {
    const medkit = new Medkit({
      position: [obj.x, obj.y]
    });
    engine.addEntity(medkit);
    return medkit;
  }

  constructor(props) {
    super({
      position: props.position,
      size: [12, 12]
    });

    this.itemName = "Medkit";
    this.sprite = Medkit.getIcon();

    this.mesh = new Object3D();
    this.readyPromise = this.sprite.readyPromise;

    this.readyPromise.then(() => {
      this.mesh.add(this.sprite.mesh);
    });
  }
}
