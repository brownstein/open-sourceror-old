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

// patch things
window.decomp = decomp;
import regeneratorRuntime from "regenerator-runtime";

// pull in React
import { useState, useEffect } from "react";
import ReactDom from "react-dom";

import SimpleShape from "./simple-shape";
import ComplexShape, { groundMaterial } from "./complex-shape";
import { traverseTileGrid } from "./grid-to-polygon";
import { loadTileset } from "./tileset-loader";
import { Player } from "./character/player";
import { Enemy } from "./character/enemy";
import Engine from "./engine";

import ScriptRunner from "./script-runner/script-runner";

import "./style.less";

import tilesetPng from "./tilesets/magic-cliffs/PNG/tileset.png";

let renderEl;
let scene, camera, renderer;

const windowSize = { width: 400, height: 400 };

// source script to run
const srcScript = `
console.log('START');
function go() {
  console.log('starting');
  Promise.resolve(1).then(l => {
    go();
  });
}
go();
`

function App () {
  const [state, setState] = useState({
    scriptRunner: null,
    highlightedTextSegment: [null, null]
  });
  useEffect(() => {
    const scriptRunner = new ScriptRunner(srcScript);
    setState({ ...state, scriptRunner });
    let t = 0;
    function onFrame () {
      if (scriptRunner.ready && !(t++ % 2)) {
        if (!scriptRunner.hasNextStep) {
          return;
        }
        scriptRunner.doNextStep();
        const highlightedTextSegment = scriptRunner.getExecutingSection();
        const [start, end] = highlightedTextSegment;
        if (start && end) {
          setState({ ...state, highlightedTextSegment });
        }
      }
      requestAnimationFrame(onFrame);
    }
    onFrame();
  }, []);
  const { highlightedTextSegment } = state;
  const [start, end] = highlightedTextSegment;
  const parts = [];
  parts.push(srcScript.slice(0, start || 0));
  parts.push(<span key={1} className="highlighted">{srcScript.slice(start || 0, end || 0)}</span>);
  parts.push(srcScript.slice(end || 0, srcScript.length));
  return <div className="script-display">{parts}</div>;
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
