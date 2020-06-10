import { SimpleSprite } from "src/engine/sprites";
import scrollPNG from "./sprites/scroll.png";

import BaseItem from "./base";

export default class Scroll extends BaseItem {
  getInstance() {

  }
  getIcon() {
    return new SimpleSprite(scrollPNG);
  }
}
