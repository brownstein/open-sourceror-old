"use strict";
const { ipcRenderer } = require("electron");
const Interpreter = require("js-interpreter");
const patchJSInterpreter = require("./async-js-interpreter-patch");
const acorn = require("acorn");
const fs = require("fs");
const delay = require("delay");

var THREE = require("three");
var {
  Box3,
  Scene,
  Vector3,
  Vector2,
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
  SymbolText,
  applyCircularLayout,

  scriptToCircle,

  CircleGroupSlice,
  CircleStackSlice,
  CircleTextSlice,
  runLayout,

  convertScriptToSlices
} = require("./dist");

let scr = `
"use strict";
var cache = {0: 1, 1: 1};
function fibo (n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  // if (cache[n]) {
  //   return cache[n];
  // }
  log(n);
  var sum = fibo(n - 1) + fibo(n - 2);
  //cache[n] = sum;
  return sum;
}
log(testing);
log(fibo(10));
`;

scr = `
"use strict";
function doSomething () {
  for (var i=0; i < 2; i++) {
    log(i);
  }
}
doSomething();
log(test2(function vv (val) {
  for (var i=0; i < 2; i++) {
    log(val);
  }
  log(val);
}) * 2);
log(test3);
`;

const parsed = acorn.parse(scr, {
  locations: true
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

  //const [ctx, mainSlices] = scriptToCircle(parsed);
  const [ctx, mainSlice] = convertScriptToSlices(parsed);
  const mainSlices = [mainSlice];
  runLayout(mainSlices[0]);

  console.log(mainSlices);

  const container = new Object3D();
  mainSlices.forEach(s => s.addMeshesToContainer(container));
  const maxRadius = mainSlices[0].getMaxRadius();
  container.scale.multiplyScalar(80 / maxRadius);
  console.log({ maxRadius });
  scene.add(container);

  renderer.render(scene, camera);

  // interp patch here
  patchJSInterpreter(Interpreter);

  const interp = new Interpreter(scr, (interpreter, scope) => {
    interpreter.setProperty(
      scope,
      "log",
      interpreter.createNativeFunction(f => console.log(f.data))
    );
    interpreter.setProperty(
      scope,
      "testing",
      { data: "foo bar" }
    );
    interpreter.setProperty(
      scope,
      "test",
      interpreter.createAsyncFunction(
        function (f, callback){
          Promise.resolve().then(() => {
            callback({ data: f.data * 2 });
          });
        }
      )
    );
    interpreter.setProperty(
      scope,
      "test2",
      interpreter.createNativeFunction(
        function (f) {
          interpreter.setProperty(scope, "test3", interpreter.nativeToPseudo("amazing"));
          setTimeout(
            () => interpreter.queueCall(
              f,
              [interpreter.nativeToPseudo("hi world I'm bob")]
            ),
            2000
          )
          return interpreter.nativeToPseudo(10);
        }
      )
    );
  });

  console.log({ interp });

  let lastPart = null;
  while (interp.stateStack.length) {
    const node = interp.stateStack[interp.stateStack.length - 1].node;
    const nodeKey = `${node.start}:${node.end}`;
    const partByKey = ctx.slicesByPosition[nodeKey];
    if (partByKey) {
      const center = new Vector2();
      partByKey.recolor(new Color(255, 0, 0));
      center.add(partByKey.getMeshCenter());

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
      lastPart = partByKey;
    }
    if (!interp.step()) {
      continue;
    }
  }

}

init();

// sourcemap experiment here
// const babel = require("@babel/core");
// const vlq = require("vlq");
// const esScr = `const funky = ({ a }) => console.log(...a);`;
//
// babel.transform(esScr, {
//   plugins: [],
//   presets: ["@babel/preset-env"],
//   ast: true,
//   generatorOpts: {
//     sourceMaps: true
//   }
// }, (err, result) => {
//   console.log(result.ast);
//   console.log(result.code);
//   console.log(result.map);
//   result.map.mappings.split(";").forEach(n => {
//     n.split(",").forEach(m => {
//       const decoded = vlq.decode(m);
//       console.log(m, decoded);
//     })
//   });
// });
