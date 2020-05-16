import {
  Color,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";
import * as p2 from "p2";
import * as decomp from "poly-decomp";
import SimpleShape from "./simple-shape";
import ComplexShape, { groundMaterial } from "./complex-shape";
import { traverseGrid } from "./grid-to-polygon";
import { loadTileset } from "./tileset-loader";
import KeyState from "./key-state";
import { Character } from "./character/base";
import Engine from "./engine";

window.decomp = decomp;
import "./style.less";

import tilesetPng from "./tilesets/magic-cliffs/PNG/tileset.png";

let renderEl;
let scene, camera, renderer;

const windowSize = { width: 400, height: 400 };

export default async function initScene() {

  // init game engine
  const engine = new Engine();
  const containerEl = document.getElementById("container");
  engine.initWithContainerElement(containerEl);
  engine.run();

  // add a character
  for (let i = 0; i < 2; i++) {
    const character = new Character();

    engine.addEntity(character);
    engine.world.addContactMaterial(new p2.ContactMaterial(
      character.body.shapes[0].material,
      groundMaterial,
      { friction: 0.8 }
    ));

    engine.followEntity(character);
  }

  const [
    level1,
    tilesetJson,
  ] = await Promise.all([
    import("./tilesets/magic-cliffs/level2.json"),
    import("./tilesets/magic-cliffs/tileset.json"),
  ]);

  const tileset = loadTileset(tilesetJson, tilesetPng);

  const levelData = level1.layers[0].data;
  const levelDataWidth = level1.layers[0].width;
  const levelDataTileWidth = level1.tilewidth;

  const groundPolygonsAndTiles = traverseGrid(
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
        position: [-96, -96]
      }
    );
  });
  groundShapes.forEach(s => engine.addEntity(s));
}
