import { SimpleSprite } from "src/engine/sprites";
import medkitPNG from "./sprites/medkit.png";

import BaseItem from "./base";

export default class Medkit extends BaseItem {
  getInstance() {

  }
  getIcon() {
    return new SimpleSprite(medkitPNG);
  }
}
