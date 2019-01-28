"use strict";
const { ipcRenderer } = require("electron");
const esprima = require("esprima");

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
  on(MOTION, ()=> {
    var a = 1;
    console.log(a);
  });
`;
const parsed = esprima.parseScript(scr, {
  range: true,
  loc: true
});
function visitor (node) {
  console.log(node);
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
  renderer.setClearColor(new Color("#cccccc"));
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(256, 256);

  await loadAllFonts();

  // const textMesh = await createText("abcdefghijlkmn\nopqrstubwxyz.");
  // textMesh.geometry.computeBoundingBox();
  // const bbox = textMesh.geometry.boundingBox;
  // const bboxSize = new Vector3();
  // bbox.getSize(bboxSize);
  // bboxSize.multiplyScalar(0.5);
  // textMesh.position.x = -bboxSize.x / 2;
  // textMesh.position.y = bboxSize.y / 2 - 50;
  // textMesh.scale.multiplyScalar(0.5);
  // scene.add(textMesh);
  //
  // const runicMesh = await createRunicText("abcdefghijlkmn\nopqrstubwxyz.");
  // runicMesh.geometry.computeBoundingBox();
  // const runicBbox = runicMesh.geometry.boundingBox;
  // const runicBboxSize = new Vector3();
  // runicBbox.getSize(runicBboxSize);
  // runicBboxSize.multiplyScalar(0.5);
  // runicMesh.position.x = -runicBboxSize.x / 2;
  // runicMesh.position.y = runicBboxSize.y / 2;
  // runicMesh.scale.multiplyScalar(0.5);
  // scene.add(runicMesh);

  const cSlice1 = new CircleSlice({ radius: 40, startTheta: Math.PI / 2 + 0.1, endTheta: Math.PI * 2 - 0.05 });
  const cSlice2 = new CircleSlice({ radius: 40, startTheta: 0.05, endTheta: Math.PI / 2 });
  const symbol = new SymbolText();
  scene.add(cSlice1.createMesh());
  scene.add(cSlice2.createMesh());
  scene.add(symbol.createMesh());

  renderer.render(scene, camera);
}

init();
