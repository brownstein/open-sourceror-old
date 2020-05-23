import EventEmitter from "events";
import { Component, createContext } from "react";
import { ContactMaterial } from "p2";

import { traverseTileGrid } from "../utils/grid-to-polygon";
import { loadTileset } from "../utils/tileset-loader";

import { Player } from "../entities/character/player";
import { Enemy } from "../entities/character/enemy";
import { TilesetTerrain, terrainMaterial } from "../entities/terrain";

import { EngineProvider } from "./engine";
import { EngineViewport } from "./viewport";
import CodeExecutor from "./code-executor";

import tilesetPng from "../tilesets/magic-cliffs/PNG/tileset.png";

import "./game.less";

export const GameContext = createContext({
  engine: null,
  paused: false
});

async function addThings(engine) {

  // add a character
  const player = new Player({
    position: [200, 100]
  });

  engine.addEntity(player);
  engine.followEntity(player);

  engine.world.addContactMaterial(new ContactMaterial(
    player.body.shapes[0].material,
    terrainMaterial,
    { friction: 1 }
  ));

  const enemy = new Enemy();
  engine.addEntity(enemy);

  const [
    level1,
    tilesetJson,
  ] = await Promise.all([
    import("../tilesets/magic-cliffs/level2.json"),
    import("../tilesets/magic-cliffs/tileset.json"),
  ]);

  const terrain = new TilesetTerrain(level1, tilesetJson, tilesetPng);
  await terrain.readyPromise;

  terrain.getEntities().forEach(e => engine.addLevelEntity(e));
}

export default function Game () {
  return (
    <EngineProvider addThings={addThings}>
      <div className="game">
        <div className="game-viewport">
          <EngineViewport/>
        </div>
        <div className="game-code-editor">
          <CodeExecutor/>
        </div>
      </div>
    </EngineProvider>
  );
}
