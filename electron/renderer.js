"use strict";
const { ipcRenderer } = require("electron");
const delay = require("delay");
const {
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer,
  OrthographicCamera,
  Color,
  Object3D
} = require("three");

const {
  loadAllFonts
} = require("./dist");

const script = require("./player-script");
const { createScriptRunner } = require("./script-runner");

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

  const scriptRunner = await createScriptRunner(script);
  const mainSlice = scriptRunner.mainSlice;

  const container = new Object3D();
  mainSlice.addMeshesToContainer(container);
  const maxRadius = mainSlice.getMaxRadius();
  container.scale.multiplyScalar(80 / maxRadius);
  scene.add(container);

  renderer.render(scene, camera);

  let lastPart = null;
  while (scriptRunner.hasNextStep()) {
    const nextSlice = scriptRunner.getCurrentSlice();
    if (nextSlice) {
      const center = new Vector2();
      nextSlice.recolor(new Color(255, 0, 0));
      center.add(nextSlice.getMeshCenter());

      let nextRotation = -center.angle() - Math.PI / 2;
      if (nextRotation < 0) {
        nextRotation += Math.PI * 2;
      }
      if ((nextRotation - container.rotation.z) > Math.PI) {
        nextRotation -= Math.PI * 2;
      }
      else if ((nextRotation - container.rotation.z) < -Math.PI) {
        nextRotation += Math.PI * 2;
      }
      const rotDelta = (nextRotation - container.rotation.z) / 10;
      for (let i = 0; i < 10; i++) {
        container.rotation.z += rotDelta;
        if (container.rotation.z < 0) {
          container.rotation.z += Math.PI * 2;
        }
        else if (container.rotation.z > Math.PI * 2) {
          container.rotation.z -= Math.PI * 2;
        }
        renderer.render(scene, camera);
        await delay(15);
      }
      if (lastPart) {
        lastPart.recolor(new Color(255, 255, 255));
      }
      lastPart = nextSlice;
    }
    if (!scriptRunner.doNextStep()) {
      console.log("nothing to do, waiting...");
      await delay(1000);
    }
  }
  console.log("DONE");
}

init();
