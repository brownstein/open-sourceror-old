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
import ComplexShape from "./complex-shape";
import { traverseGrid } from "./grid-to-polygon";
import { loadTileset } from "./tileset-loader";

window.decomp = decomp;
import "./style.less";

import level1 from "./tilesets/magic-cliffs/level1.json";
import tilesetJson from "./tilesets/magic-cliffs/tileset.json";
import tilesetPng from "./tilesets/magic-cliffs/PNG/tileset.png";

let renderEl;
let scene, camera, renderer;

const windowSize = { width: 400, height: 400 };

export default function initScene() {
  const containerEl = document.getElementById("container");

  renderEl = document.createElement("canvas");
  renderEl.style = `
    background: #cccccc;
    width: ${windowSize.width}px;
    height: ${windowSize.height}px;
  `;
  containerEl.appendChild(renderEl);

  // set up three.js world and renderer
  scene = new Scene();
  camera = new OrthographicCamera(
    -100, 300,
    -100, 300,
    -100, 100
  );
  camera.lookAt(new Vector3(0, 0, -1));
  camera.position.copy(new Vector3(0, 0, 1));

  renderer = new WebGLRenderer({
    // alpha: true,
    canvas: renderEl,
    preserveDrawingBuffer: true
  });
  renderer.setClearColor(new Color("#444444"));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(windowSize.width, windowSize.height);

  // set up matter.js world and renderer
  const world = new p2.World({
    gravity:[0, 300]
  });

  // add things to the world
  const triverts = [{ x: 0, y: 0 }, { x: 10, y: -50 }, { x: 50, y: 0 }];
  const thing = new SimpleShape(triverts, {
    mass: 5,
    damping: 0.5,
    angularVelocity: 5
  });

  scene.add(thing.mesh);
  world.addBody(thing.body);

  const tileset = loadTileset(tilesetJson, tilesetPng);

  const levelData = level1.layers[0].data;
  const levelDataWidth = level1.layers[0].width;
  const levelDataTileWidth = level1.tilewidth;

  const groundPolygonsAndTiles = traverseGrid(
    levelData,
    levelDataWidth,
    15, //levelDataTileWidth,
    tileset
  );

  console.log(groundPolygonsAndTiles);

  const groundShapes = groundPolygonsAndTiles.map(g => {
    return new ComplexShape(
      g.polygons,
      g.tiles,
      {
        mass: 0,
        isStatic: true,
        position: [-96, -96]
      }
    );
  });
  groundShapes.forEach(s => {
    scene.add(s.mesh);
    world.addBody(s.body);
  });

  const fixedTimeStep = 1 / 60; // seconds
  const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
  let lastTime;
  function renderNextFrame() {
    const time = new Date().getTime();
    var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
    world.step(fixedTimeStep, deltaTime, maxSubSteps);
    lastTime = time;
    thing.syncMeshWithBody();
    groundShapes.forEach(p => p.syncMeshWithBody());
    renderer.render(scene, camera);
    requestAnimationFrame(renderNextFrame);
  }
  requestAnimationFrame(renderNextFrame);
}
