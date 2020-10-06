import { Vector2 } from "three";

import Room from "src/engine/room";

// level-specific constructs
import levelJson from "src/tilesets/magic-cliffs/pathfinding-tester.json";
import tilesetJson from "src/tilesets/magic-cliffs/tileset.json";
import tilesetPNG from "src/tilesets/magic-cliffs/PNG/tileset.png";

export default class PathfindingTest extends Room {
  constructor() {
    super();
    this.tileLevel = levelJson;
    this.tileSheet = {
      tileset: tilesetJson
    };
    this.tileSheetPNG = {
      tileset: tilesetPNG
    };
  }
}
