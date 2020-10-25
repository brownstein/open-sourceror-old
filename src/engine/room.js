import { Vector2 } from "three";
import { vec2 } from "p2";

// navigation meshes
// import { NavGrid } from "src/pathfinding/navigation-grid";
import { AsyncNavGrid } from "src/pathfinding/navigation-grid-async";

import { vec2ToVector3 } from "src/p2-utils/vec2-utils";

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
import { DoorSpawn } from "src/entities/environment/door";
import { Fox } from "src/entities/character/critters/fox";

import getContactMaterials from "src/entities/contact-materials";

const ENTITIES = [
  Player,
  Enemy,
  TestDummy,
  DoorSpawn,
  NPC,
  SavePoint,
  Scroll,
  Medkit,
  TransitionZone,
  SmallBodyOfWater,
  DialogueEntity,
  BackgroundText,
  Fox
];

const PERSIST_STORE = {};

// we'll access this from the load/save code directly
export function persistRoomState(roomId, engine) {
  const snapshot = engine.getSnapshot();
  if (!PERSIST_STORE[roomId]) {
    PERSIST_STORE[roomId] = snapshot;
  }
  else {
    Object.assign(PERSIST_STORE[roomId], snapshot);
  }
}

// we'll access this from the load/save code directly
export function getPersistedRoomState(roomId, entities) {
  const roomState = PERSIST_STORE[roomId];
  return roomState || {};
}

// we'll access this from the load/save code directly
export function getCompletePersistenceState() {
  return PERSIST_STORE;
}

// we'll access this from the load/save code directly
export function setCompletePersistenceState(fullState) {
  Object.assign(PERSIST_STORE, fullState);
}

export default class Room {
  constructor() {
    this.tileLevel = null;
    this.tileSheets = null;
    this.tileSheetPNGs = null;
    this.backgroundEntities = [];
  }
  init(engine, roomState) {
    if (
      this.tileLevel &&
      this.tileSheets &&
      this.tileSheetPNGs
    ) {
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
    persistRoomState(this.roomName, engine);

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
    const {
      transitionPosition,
      currentRoom,
      previousRoom,
      transitionType // TODO: use me
    } = roomState;
    const persistenceState = getPersistedRoomState(this.roomName);

    // add the map
    const terrain = new TilesetTerrain(
      this.tileLevel,
      this.tileSheets,
      this.tileSheetPNGs
    );
    terrain.getEntities().forEach(e => {
      engine.addEntity(e);
      engine.expandSceneToFitEntity(e);
    });

    // add the navigation grid
    const navGrid = AsyncNavGrid.createNavGridForTileGrid(
      this.tileLevel,
      this.tileSheets
    );
    engine.addNavGrid(navGrid);
    navGrid.initNavWorker();

    let playerSpawned = false;
    let savePoint = null;
    const roomTransitions = [];

    // add level entities
    let persistIdIncrement = 0;
    this.tileLevel.layers.filter(l => l.type === "objectgroup").forEach(l => {
      l.objects.forEach(o => {
        const persistId = `${o.type}-${persistIdIncrement++}`;
        const EntityClass = ENTITIES.find(
          clazz =>
          clazz.roomEntityNames &&
          clazz.roomEntityNames.includes(o.type)
        );
        const props = o.properties ?
          o.properties.reduce((o, p) => {
            o[p.name] = p.value;
            return o;
          }, {}) :
          {};

        if (EntityClass) {
          switch (o.type) {
            case "playerStart": {
              const persisted = persistenceState[persistId];
              const entity = EntityClass.roomInitializer(engine, o, props,
                persistId, persisted);
              playerSpawned = true;
              break;
            }
            case "room-transition": {
              const persisted = persistenceState[persistId];
              const entity = EntityClass.roomInitializer(engine, o, props,
                persistId, persisted);
              roomTransitions.push(entity);
              break;
            }
            case "savePoint": {
              const persisted = persistenceState[persistId];
              const entity = EntityClass.roomInitializer(engine, o, props,
                persistId, persisted);
              savePoint = entity;
              break;
            }
            default: {
              const persisted = persistenceState[persistId];
              const entity = EntityClass.roomInitializer(engine, o, props,
                persistId, persisted);
              break;
            }
          }
        }
        else {
          console.warn("unrecognized entity in room", this.roomName, o.type);
        }
      });

      // if the player isn't explicitly positioned in the room,
      // they probably entered through a door. find that door and spawn
      // the player there
      if (!playerSpawned) {
        if (transitionType === "traverse") {
          let roomTransition;
          roomTransitions.forEach(t => {
            if (t.transitionToLevel === previousRoom) {
              roomTransition = t;
            }
          });
          if (!roomTransition) {
            roomTransition = roomTransitions[0];
          }
          if (!roomTransition) {
            throw new Error("unable to find room transition");
          }

          roomTransition.spawnColliding = true;

          const playerPos = vec2ToVector3(roomTransition.body.position);
          Player.roomInitializer(engine, playerPos, {}, 'player', null);
          playerSpawned = true;
        }
        else {
          if (!savePoint) {
            throw new Error("no save point in room");
          }

          const playerPos = vec2ToVector3(savePoint.body.position);
          Player.roomInitializer(engine, playerPos, {}, 'player', null);
          playerSpawned = true;
        }
      }
    });
  }
}
