"use strict";
const { ipcRenderer } = require("electron");
const Interpreter = require("js-interpreter");
const patchJSInterpreter = require("./async-js-interpreter-patch");
const acorn = require("acorn");
const fs = require("fs");
const delay = require("delay");

// transpiler stuff
const babel = require("@babel/core");
const babelParser = require("@babel/parser");
const vlq = require("vlq");
const ASTLocationMap = require("./ast-location-map");
const SourceMapMap = require("./source-map-map");

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

const { script, hookIntoInterpreter } = require("./player-script");

let renderEl;
let scene, camera, renderer;

const parsed = acorn.parse(script, {
  locations: true
});

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
  scene.add(container);

  renderer.render(scene, camera);

  // interp patch here
  patchJSInterpreter(Interpreter);

  const interp = new Interpreter(script, (interpreter, scope) => {
    interpreter.setProperty(
      scope,
      "log",
      interpreter.createNativeFunction(f => console.log(f.data))
    );

    // add functions found in player-script.js
    hookIntoInterpreter(interpreter, scope);
  });

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

// init();

function transpileAndCreateSourcemap (sourceScript) {
  return new Promise((resolve, reject) => {
    babel.transform(
      sourceScript,
      {
        plugins: [],
        presets: ["@babel/preset-env"],
        ast: true,
        generatorOpts: {
          sourceMaps: true
        }
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }
        const sm = new SourceMapMap(result.map);
        resolve([result.ast, result.code, sm]);
      }
    );
  });
}

async function doCrossCompileSequence () {
  const [ast, transpiled, sm] = await transpileAndCreateSourcemap(script);
  console.log(transpiled);
  console.log(sm);
}

// doCrossCompileSequence();



//
// const esScr = `
// "use strict";
// function func ({ a }) {
//   console.log(a);
// }`;
//
// babel.transform(esScr, {
//   plugins: [],
//   presets: ["@babel/preset-env"],
//   ast: true,
//   generatorOpts: {
//     sourceMaps: true
//   }
// }, (err, result) => {
//
//   const sourceAST = babelParser.parse(esScr);
//   const destAST = acorn.parse(result.code, { locations: true });
//
//   console.log("SOURCE AST", sourceAST);
//   console.log("DEST AST", destAST);
//
//   function _getAllASTNodes (ast, nodes = []) {
//     if (Array.isArray(ast)) {
//       ast.forEach(n => _getAllASTNodes(n, nodes));
//       return nodes;
//     }
//     if (!ast || !ast.type) {
//       return nodes;
//     }
//     nodes.push(ast);
//     Object.keys(ast).forEach(key => _getAllASTNodes(ast[key], nodes));
//     return nodes;
//   }
//
//   console.log("SOURCE AST NODES", _getAllASTNodes(sourceAST, []));
//   console.log("DEST AST NODES", _getAllASTNodes(destAST, []));
//
//   console.log(result.map.mappings.replace(/;/g, "\n"));
//
  // const sm = new SourceMapMap(result.map);
  // console.log(result.code);
//
//   console.log(sm);
//   console.log(sm.getSourceLocation({ line: 15, column: 10 }));
//
//   // console.log(result.map);
//   // result.map.mappings.split(";").forEach(n => {
//   //   n.split(",").forEach(m => {
//   //     const decoded = vlq.decode(m);
//   //     console.log(m, decoded);
//   //   })
//   // });
// });
