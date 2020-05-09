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

window.decomp = decomp;
import "./style.less";

import level from "./tiles-level-test.json";

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
    angularVelocity: 50
  });

  scene.add(thing.mesh);
  world.addBody(thing.body);

  console.log(level);
  const _levelData = level.layers[0].data;
  const _levelDataWidth = level.layers[0].width;
  const _levelDataTileWidth = level.tilewidth;

  const groundPolygons = traverseGrid(_levelData, _levelDataWidth, _levelDataTileWidth);

  console.log(groundPolygons);

  const groundShapes = groundPolygons.map(g => {
    return new ComplexShape(
      g,
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
    groundShapes[0].angle += 0.05;
  }
  requestAnimationFrame(renderNextFrame);
}

// const levelData = [
//   1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
//   1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,0,0,2,0,0,0,1,
//   1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,
//   1,0,0,0,0,0,5,0,0,0,0,2,0,0,0,1,
//   1,0,0,0,0,5,1,0,0,0,0,1,2,0,0,1,
//   1,0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,
//   1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,
//   1,0,0,0,0,0,0,0,0,0,0,1,2,0,0,1,
//   1,1,0,0,0,0,0,0,0,0,0,1,1,2,0,1,
//   1,0,1,2,0,0,0,0,0,0,0,0,1,1,1,1,
//   1,0,0,1,2,0,0,0,0,0,0,0,0,0,0,1,
//   1,0,0,1,1,1,2,0,0,0,0,0,0,0,0,1,
//   1,0,0,1,1,2,1,1,2,0,0,0,0,0,0,1,
//   1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
// ];
const levelData = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,5,1,1,2,0,0,1,
  1,0,0,0,0,0,0,0,0,1,3,4,1,0,0,1,
  1,0,0,0,0,0,0,0,0,1,2,5,1,0,0,1,
  1,2,0,0,0,0,0,0,0,4,1,1,3,0,0,1,
  1,1,1,2,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,2,0,0,0,0,5,1,2,0,0,0,1,
  1,0,0,4,1,1,2,0,0,4,1,3,0,0,0,1,
  1,1,0,0,1,1,1,2,0,0,0,0,0,0,0,1,
  1,1,0,0,1,1,1,1,2,0,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
];
// const levelData = [
//   5,1,1,1,2,
//   1,3,0,4,1,
//   1,2,0,5,1,
//   4,1,1,1,3,
// ]
const levelDataWidth = 16;
