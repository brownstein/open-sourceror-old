"use strict";
const { ipcRenderer } = require("electron");
const esprima = require("esprima");
const fs = require("fs");

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
  loadAllFonts,
  createText,
  createRunicText,

  CircleSlice,
  SymbolText
} = require("./dist");

const scr = `
  "use strict";
  on(MOTION, (move)=> {
    var a = move;
    PLAYER.position.add(a.direction);
    console.log(a);
  });
`;
const parsed = esprima.parseScript(scr, {
  range: false,
  loc: false
});
function visitor (node) {
  console.log(node);
  fs.writeFileSync("temp1.json", JSON.stringify(node, 0, 2));
}
visitor(parsed);


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
  renderer.setClearColor(new Color("#444444"));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(256, 256);

  await loadAllFonts();

  const cSlice1 = new CircleSlice({ radius: 40, startTheta: Math.PI / 2 + 0.1, endTheta: Math.PI * 2 - 0.05 });
  const cSlice2 = new CircleSlice({ radius: 40, startTheta: 0.05, endTheta: Math.PI / 2 });
  const symbol = new SymbolText({ value: "test" });
  const sm = symbol.createMesh();

  scene.add(cSlice1.createMesh());
  scene.add(cSlice2.createMesh());
  scene.add(sm);

  renderer.render(scene, camera);
}

init();
