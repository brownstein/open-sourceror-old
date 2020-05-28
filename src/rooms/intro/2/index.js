import { Vector2 } from "three";

import Room from "src/engine/room";
import { RepeatingBackgroundImage } from "src/entities/background";

// level-specific constructs
import levelJson from "src/tilesets/magic-cliffs/level2-actual.json";
import tilesetJson from "src/tilesets/magic-cliffs/tileset.json";
import tilesetPNG from "src/tilesets/magic-cliffs/PNG/tileset.png";

export default class Level2 extends Room {
  constructor() {
    super();
    this.tileLevel = levelJson;
    this.tileSheet = tilesetJson;
    this.tileSheetPNG = tilesetPNG;
  }
}
