import { Vector2 } from "three";

import Room from "src/engine/room";
import { RepeatingBackgroundImage } from "src/entities/background";

// level-specific constructs
import levelJson from "src/tilesets/magic-cliffs/room-1.json";
import tilesetJson from "src/tilesets/magic-cliffs/tileset.json";
import tilesetPNG from "src/tilesets/magic-cliffs/PNG/tileset.png";

// level background images
import bgSky from "src/tilesets/magic-cliffs/PNG/sky.png";
import bgClouds from "src/tilesets/magic-cliffs/PNG/clouds.png";
import bgSea from "src/tilesets/magic-cliffs/PNG/sea.png";
import bgFarGrounds from "src/tilesets/magic-cliffs/PNG/far-grounds.png";

export default class Level1 extends Room {
  constructor() {
    super();
    this.roomName = "tutorial-1";
    this.tileLevel = levelJson;
    this.tileSheets = {
      tileset: tilesetJson
    };
    this.tileSheetPNGs = {
      tileset: tilesetPNG
    };

    this.backgroundEntities = [
      new RepeatingBackgroundImage(bgSky, {
        wrapX: true,
        extendX: true,
        extendY: true
      }),
      new RepeatingBackgroundImage(bgClouds, {
        wrapX: true,
        extendX: true,
        moveParallax: true,
        parallaxCenter: new Vector2(0, 10),
        parallaxCoefficient: 0.1,
        pixelScale: 0.8,
        layer: 1
      }),
      new RepeatingBackgroundImage(bgSea, {
        wrapX: true,
        extendX: true,
        extendY: true,
        moveParallax: true,
        parallaxCenter: new Vector2(0, 100),
        layer: 2,
        parallaxCoefficient: 0.2
      }),
      new RepeatingBackgroundImage(bgFarGrounds, {
        moveParallax: true,
        parallaxCenter: new Vector2(200, 100),
        layer: 3,
        extendY: true,
        pixelScale: 1,
        parallaxCoefficient: 0.4
      })
    ];
  }
}
