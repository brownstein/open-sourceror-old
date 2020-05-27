import { Vector2 } from "three";

// navigation meshes
import { getNavGridForTileGrid } from "src/utils/grid-to-navnodes";

// game entities
import { Player } from "src/entities/character/player";
import { Enemy, SmartEnemy } from "src/entities/character/enemy";
import { TilesetTerrain, terrainMaterial } from "src/entities/terrain";
import { SmallBodyOfWater } from "src/entities/environment/water";
import { DialogueEntity } from "src/entities/presentational/dialogue";
import TransitionZone from "src/entities/environment/transition-zone";

import getContactMaterials from "src/entities/contact-materials";

export default class Room {
  constructor() {
    this.tileLevel = null;
    this.tileSheet = null;
    this.tileSheetPNG = null;
    this.backgroundEntities = null;
  }
  init(engine) {
    if (this.tileLevel && this.tileSheet && this.tileSheetPNG) {
      this.initTileLevel(engine);
    }
    else {
      throw new Error("room needs a tile level and tile sheet");
    }

    // add background images
    this.backgroundEntities.forEach(bg => {
      engine.addEntity(bg);
      engine.cameraTrackEntity(bg);
    });

    // consrain room by level geometry
    engine.on("everythingReady", () => engine.constrainRoom());

    // apply contact materials (TODO: make this not room-specific)
    getContactMaterials().forEach(m => engine.world.addContactMaterial(m));

    console.log(engine);
  }
  cleanup(engine) {
    return;
  }
  initTileLevel(engine) {

    // add the map
    const terrain = new TilesetTerrain(this.tileLevel, this.tileSheet,
      this.tileSheetPNG);
    terrain.getEntities().forEach(e => {
      engine.addEntity(e);
      engine.expandSceneToFitEntity(e);
    });

    // add the navigation grid
    const primaryLayer = this.tileLevel.layers.find(l => l.name === "primary") ||
      this.tileLevel.layers.find(l => l.layertype === "tilelayer");
    const navGrid = getNavGridForTileGrid(
      primaryLayer.data,
      primaryLayer.width,
      16,
      this.tileSheet
    );
    engine.addNavGrid(navGrid);

    // add level entities
    this.tileLevel.layers.filter(l => l.type === "objectgroup").forEach(l => {
      l.objects.forEach(o => {
        switch (o.type) {
          case "playerStart": {
            const player = new Player({
              position: [o.x, o.y]
            });
            engine.addEntity(player);
            engine.followEntity(player);
            engine.setControllingEntity(player);

            const dialogue = new DialogueEntity(new Vector2(o.x, o.y));
            engine.addEntity(dialogue);

            break;
          }
          case "enemyStart": {
            let isSmart = false;
            o.properties && o.properties.forEach(p => {
              if (p.name === "isSmart" && p.value) {
                isSmart = true;
              }
            });
            const EnemyClazz = isSmart ? SmartEnemy : Enemy;
            const enemy = new EnemyClazz({
              position: [o.x, o.y]
            });
            engine.addEntity(enemy);
            break;
          }
          case "water": {
            const water = new SmallBodyOfWater({
              position: {
                x: o.x + o.width / 2,
                y: o.y + o.height / 2
              },
              width: o.width,
              height: o.height
            });
            engine.addEntity(water);
            break;
          }
          case "dialogue": {
            const dialogue = new DialogueEntity({
              x: o.x,
              y: o.y
            }, o.properties.find(p => p.name === "message").value);
            engine.addEntity(dialogue);
            break;
          }
          case "transitZone": {
            const zone = new TransitionZone({
              position: {
                x: o.x + o.width / 2,
                y: o.y + o.height / 2
              },
              width: o.width,
              height: o.height,
              level: o.properties.find(p => p.name === "level").value
            });
            engine.addEntity(zone);
            break;
          }
          default:
            break;
        }
      });
    });
  }
}
