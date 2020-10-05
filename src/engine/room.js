import { Vector2 } from "three";
import { vec2 } from "p2";

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
import { Medkit, Scroll } from "src/entities/items";
import { BackgroundText } from "src/entities/background/background-text";
import { ConditionWall } from "src/entities/environment/condition-wall";
import SavePoint from "src/entities/environment/save-point";

import getContactMaterials from "src/entities/contact-materials";

export default class Room {
  constructor() {
    this.tileLevel = null;
    this.tileSheet = null;
    this.tileSheetPNG = null;
    this.backgroundEntities = [];
  }
  init(engine, roomState) {
    if (this.tileLevel && this.tileSheet && this.tileSheetPNG) {
      this.initTileLevel(engine, roomState);
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
    function _constrain() {
      engine.constrainRoom()
      engine.off("everythingReady", _constrain);
    }
    engine.on("everythingReady", _constrain);

    // apply contact materials (TODO: make this not room-specific)
    getContactMaterials().forEach(m => engine.world.addContactMaterial(m));

    engine.currentRoom = this;
  }
  cleanup(engine) {
    engine.activeEntities.forEach(e => {
      engine.removeEntity(e);
    });
    engine.setControllingEntity(null);
    engine.followEntity(null);
    engine.levelBBox.makeEmpty();

    getContactMaterials().forEach(m => engine.world.removeContactMaterial(m));

    engine.loading = true;
    engine.currentRoom = null;
  }
  initTileLevel(engine, roomState) {
    const { transitionPosition, currentRoom, previousRoom } = roomState;

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

    let playerSpawned = false;
    const roomTransitions = [];

    // add level entities
    let persistIdIncrement = 0;
    this.tileLevel.layers.filter(l => l.type === "objectgroup").forEach(l => {
      l.objects.forEach(o => {
        const persistId = `${o.type}-${persistIdIncrement++}`;

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
            playerSpawned = true;
            break;
          }
          case "enemyStart": {
            const isSmart = props.isSmart || false;
            const EnemyClazz = isSmart ? SmartEnemy : Enemy;
            const enemy = new EnemyClazz({
              position: [o.x, o.y]
            });
            enemy.persistId = persistId;
            engine.addEntity(enemy);
            break;
          }
          case "testDummyStart": {
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
          case "scroll": {
            const item = Scroll.getInstance({
              position: [o.x, o.y]
            });
            item.persistId = persistId;
            engine.addEntity(item);
            break;
          }
          case "medkit":
          case "medpack": {
            const item = Medkit.getInstance({
              position: [o.x, o.y]
            });
            item.persistId = persistId;
            engine.addEntity(item);
            break;
          }
          case "backgroundText": {
            const text = new BackgroundText({
              position: o,
              text: o.text.text,
              size: o.text.pixelsize,
              color: o.text.color || "#000000",
              outline: !!o.text.color
            });
            engine.addEntity(text);
            break;
          }
          // TODO
          case "foregroundText": {
            const text = new BackgroundText({
              position: o,
              text: o.text.text,
              size: o.text.pixelsize,
              color: o.text.color,
              z: 2
            });
            engine.addEntity(text);
            break;
          }
          case "progressBlocker": {
            const wall = new ConditionWall({
              position: {
                x: o.x + o.width / 2,
                y: o.y + o.height / 2
              },
              width: o.width,
              height: o.height
            });
            engine.addEntity(wall);
            break;
          }
          case "savePoint": {
            const savePoint = new SavePoint({
              position: {
                x: o.x + o.width / 2,
                y: o.y + o.height / 2
              },
              width: o.width,
              height: o.height
            });
            engine.addEntity(savePoint);
            break;
          }
          case "room-transition": {
            const nextRoom = props.room;
            const nextRoomDirection = props.direction;
            const zone = new TransitionZone({
              position: {
                x: o.x + o.width / 2,
                y: o.y + o.height / 2
              },
              width: o.width,
              height: o.height,
              level: nextRoom
            });
            roomTransitions.push(zone);
            engine.addEntity(zone);
            break;
          }
          default:
            break;
        }
      });

      if (!playerSpawned) {
        let roomTransition;
        roomTransitions.forEach(t => {
          if (t.level === previousRoom) {
            roomTransition = t;
          }
        });
        if (!roomTransition) {
          throw new Error("unable to find room transition");
        }

        roomTransition.spawnColliding = true;

        const player = new Player({
          position: vec2.clone(roomTransition.body.position)
        });
        engine.addEntity(player);
        engine.followEntity(player);
        engine.setControllingEntity(player);
        playerSpawned = true;
      }
    });
  }
}
