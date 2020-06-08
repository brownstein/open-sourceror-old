import { Vector2 } from "three";

// navigation meshes
// import { getNavGridForTileGrid } from "src/utils/grid-to-navnodes";
import { AsyncNavGrid } from "src/pathfinding/navigation-grid-async";

// game entities
import { Player } from "src/entities/character/player";
import { Enemy, SmartEnemy } from "src/entities/character/enemy";
import { TestDummy } from "src/entities/character/test-dummy";
import { TilesetTerrain, terrainMaterial } from "src/entities/terrain";
import { SmallBodyOfWater } from "src/entities/environment/water";
import { DialogueEntity } from "src/entities/presentational/dialogue";
import { NPC } from "src/entities/character/npc";
import TransitionZone from "src/entities/environment/transition-zone";

import getContactMaterials from "src/entities/contact-materials";

export default class Room {
  constructor() {
    this.tileLevel = null;
    this.tileSheet = null;
    this.tileSheetPNG = null;
    this.backgroundEntities = [];
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

    // apply statefulness from the global context
    console.log(engine);

    engine.currentRoom = this;
  }
  cleanup(engine) {
    engine.activeEntities.forEach(e => {
      engine.removeEntity(e);
    });
    engine.setControllingEntity(null);
    engine.followEntity(null);

    getContactMaterials().forEach(m => engine.world.removeContactMaterial(m));

    engine.loading = true;
    engine.currentRoom = null;
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
    const navGrid = AsyncNavGrid.createNavGridForTileGrid(
      primaryLayer.data,
      primaryLayer.width,
      this.tileLevel.tilewidth,
      this.tileSheet
    );
    engine.addNavGrid(navGrid);
    navGrid.initNavWorker();

    // add level entities
    this.tileLevel.layers.filter(l => l.type === "objectgroup").forEach(l => {
      l.objects.forEach(o => {
        const props = o.properties ?
          o.properties.reduce((o, p) => {
            o[p.name] = p.value;
            return o;
          }, {}) :
          {};
        switch (o.type) {
          case "playerStart": {
            const player = new Player({
              position: [o.x, o.y]
            });
            engine.addEntity(player);
            engine.followEntity(player);
            engine.setControllingEntity(player);
            break;
          }
          case "enemyStart": {
            const isSmart = props.isSmart || false;
            const EnemyClazz = isSmart ? SmartEnemy : Enemy;
            const enemy = new EnemyClazz({
              position: [o.x, o.y]
            });
            engine.addEntity(enemy);
            break;
          }
          case "testDummyStart": {
            let isSmart = false;
            // o.properties && o.properties.forEach(p => {
            //   if (p.name === "isSmart" && p.value) {
            //     isSmart = true;
            //   }
            // });
            const DummyClazz = TestDummy;
            const dummy = new DummyClazz({
              position: [o.x, o.y]
            });
            engine.addEntity(dummy);
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
            }, props.message, props.size);
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
              level: props.level
            });
            engine.addEntity(zone);
            break;
          }
          case "npc": {
            const npcDialogue = props.npcDialogue;
            const npc = new NPC({
              position: {
                x: o.x,
                y: o.y
              },
              npcDialogue
            });
            engine.addEntity(npc);
            break;
          }
          default:
            break;
        }
      });
    });
  }
}
