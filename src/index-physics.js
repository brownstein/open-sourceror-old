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

window.decomp = decomp;
import "./style.less";

let renderEl;
let scene, camera, renderer;

const windowSize = { width: 300, height: 300 };

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
    -100, 100,
    -100, 100,
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
    damping: 0.5
  });

  const groundVerts = [
    { x: 0, y: 0 },
    { x: 200, y: -30 },
    { x: 200, y: 10 },
    { x: 0, y: 10 },
  ];
  const ground = new SimpleShape(groundVerts, {
    //isStatic: true,
    mass: 0,
    fixedY: true,
    fixedRotation: true,
    position: [0, 80]
  });

  scene.add(thing.mesh);
  scene.add(ground.mesh);
  world.addBody(thing.body);
  world.addBody(ground.body);
  
  const fixedTimeStep = 1 / 60; // seconds
  const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
  let lastTime;
  function renderNextFrame() {
    const time = new Date().getTime();
    var deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
    world.step(fixedTimeStep, deltaTime, maxSubSteps);
    lastTime = time;
    thing.syncMeshWithBody();
    ground.syncMeshWithBody();
    renderer.render(scene, camera);
    requestAnimationFrame(renderNextFrame);
  }
  requestAnimationFrame(renderNextFrame);
}
