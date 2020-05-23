import EventEmitter from "events";
import { Component, createContext } from "react";
import { ContactMaterial } from "p2";

import ComplexShape, { groundMaterial } from "../complex-shape";
import { traverseTileGrid } from "../grid-to-polygon";
import { loadTileset } from "../tileset-loader";

import { Player } from "../entities/character/player";
import { Enemy } from "../entities/character/enemy";

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
    groundMaterial,
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

  const tileset = loadTileset(tilesetJson, tilesetPng);

  const levelData = level1.layers[0].data;
  const levelDataWidth = level1.layers[0].width;
  const levelDataTileWidth = level1.tilewidth;

  const groundPolygonsAndTiles = traverseTileGrid(
    levelData,
    levelDataWidth,
    levelDataTileWidth,
    tileset
  );

  const groundShapes = groundPolygonsAndTiles.map(g => {
    return new ComplexShape(
      g.polygons,
      g.tiles,
      {
        mass: 0,
        isStatic: true,
        friction: 0.9,
        position: [0, 0]
      }
    );
  });
  groundShapes.forEach(s => engine.addLevelEntity(s));
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
