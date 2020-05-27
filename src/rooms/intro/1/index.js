import { Vector2 } from "three";

import Room from "src/engine/room";
import { RepeatingBackgroundImage } from "src/entities/background";

// level-specific constructs
import levelJson from "src/tilesets/magic-cliffs/level2.json";
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
    this.tileLevel = levelJson;
    this.tileSheet = tilesetJson;
    this.tileSheetPNG = tilesetPNG;
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
        parallaxCenter: new Vector2(0, -60),
        layer: 1
      }),
      new RepeatingBackgroundImage(bgSea, {
        wrapX: true,
        extendX: true,
        extendY: true,
        moveParallax: true,
        parallaxCenter: new Vector2(0, 64),
        layer: 2,
        parallaxCoefficient: 0.2
      }),
      new RepeatingBackgroundImage(bgFarGrounds, {
        moveParallax: true,
        parallaxCenter: new Vector2(100, 100),
        layer: 3,
        extendY: true,
        pixelScale: 3,
        parallaxCoefficient: 0.4
      })
    ];
  }
}
