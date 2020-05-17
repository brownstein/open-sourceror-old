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
import ReactDom from "react-dom";

import SimpleShape from "./simple-shape";
import ComplexShape, { groundMaterial } from "./complex-shape";
import { traverseTileGrid } from "./grid-to-polygon";
import { loadTileset } from "./tileset-loader";
import KeyState from "./key-state";
import { Player } from "./character/player";
import { Enemy } from "./character/enemy";
import Engine from "./engine";

// patch things
window.decomp = decomp;
import regeneratorRuntime from "regenerator-runtime";

import "./style.less";

import tilesetPng from "./tilesets/magic-cliffs/PNG/tileset.png";

let renderEl;
let scene, camera, renderer;

const windowSize = { width: 400, height: 400 };

function App () {
  return <div>test</div>;
}

export default async function initScene() {

  // init game engine
  const engine = new Engine();
  const viewContainerEl = document.getElementById("container");
  engine.initWithContainerElement(viewContainerEl);
  engine.run();

  // init React
  const rContainer = document.createElement('div');
  viewContainerEl.appendChild(rContainer);

  const app = <App/>;

  ReactDom.render(app, rContainer);

  // add a character
  const player = new Player();

  engine.addEntity(player);
  engine.world.addContactMaterial(new p2.ContactMaterial(
    player.body.shapes[0].material,
    groundMaterial,
    { friction: 1 }
  ));

  const enemy = new Enemy();
  engine.addEntity(enemy);

  engine.followEntity(player);

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
