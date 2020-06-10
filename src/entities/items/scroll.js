import { SimpleSprite } from "src/engine/sprites";
import scrollPNG from "./sprites/scroll.png";

import BaseItem from "./base";

export default class Scroll extends BaseItem {
  static getInstance() {

  }
  static getIcon() {
    return new SimpleSprite(scrollPNG);
  }
}
