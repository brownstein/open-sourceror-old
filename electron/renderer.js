"use strict";
const { ipcRenderer } = require("electron");
//const esprima = require("esprima");

var THREE = require("three");
var {
  Box3,
  Scene,
  Vector3,
  Face3,
  Mesh,
  Geometry,
  MeshBasicMaterial,
  WebGLRenderer,
  OrthographicCamera,
  Color,
  DoubleSide,
  ShaderMaterial,
  Object3D,
  TextureLoader
} = THREE;

const {
  loadRunicFont,
  createRunicText
} = require("./dist");

// parser test stuff
// const scr = `
//   "use strict";
//   on(MOTION, ()=> {
//     var a = 1;
//     console.log(a);
//   });
// `;
// const parsed = esprima.parseScript(scr, {
//   range: true,
//   loc: true
// });
// function visitor (node) {
//   const stringified = JSON.stringify(node, 0, 2);
//   fs.writeFileSync("temp1.json", stringified);
// }
// visitor(parsed);


let renderEl;
let scene, camera, renderer;

async function init () {
  const containerEl = document.getElementById("container");
  containerEl.appendChild(document.createElement("canvas"));
  renderEl = document.querySelector("#container > canvas");
  renderEl.style = `
    background: #cccccc;
    width: 256px;
    height: 256px;
  `;

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
  renderer.setClearColor(new Color("#cccccc"));
  renderer.setPixelRatio(1);
  renderer.setSize(256, 256);

  await loadRunicFont();
  const mesh = await createRunicText("hello world");
  mesh.geometry.computeBoundingBox();

  const bbox = mesh.geometry.boundingBox;
  const bboxSize = new Vector3();
  bbox.getSize(bboxSize);
  bboxSize.multiplyScalar(0.5);

  mesh.position.x = -bboxSize.x / 2;
  mesh.position.y = bboxSize.y / 2;

  mesh.scale.multiplyScalar(0.5);

  scene.add(mesh);

  renderer.render(scene, camera);
  renderer.render(scene, camera);
}

init();
