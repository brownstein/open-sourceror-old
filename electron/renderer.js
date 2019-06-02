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
const transpileAndGetASTAndMapping = require("./get-ast-and-transpiled-code");

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

  const [ transpiled, ast, destToSrcMap ] = await transpileAndGetASTAndMapping(script);

  console.log(transpiled);

  const [ctx, mainSlice] = convertScriptToSlices(ast);
  const mainSlices = [mainSlice];
  runLayout(mainSlices[0]);

  const container = new Object3D();
  mainSlices.forEach(s => {
    console.log("SLICE", s);
    s.addMeshesToContainer(container);
  });
  const maxRadius = mainSlices[0].getMaxRadius();
  console.log({ maxRadius });
  container.scale.multiplyScalar(80 / maxRadius);
  scene.add(container);

  renderer.render(scene, camera);

  // interp patch here
  patchJSInterpreter(Interpreter);

  const interp = new Interpreter(transpiled, (interpreter, scope) => {
    interpreter.setProperty(
      scope,
      "log",
      interpreter.createNativeFunction(f => console.log(interpreter.pseudoToNative(f)))
    );

    // add functions found in player-script.js
    hookIntoInterpreter(interpreter, scope);
  });

  let lastPart = null;
  while (interp.stateStack.length) {
    const node = interp.stateStack[interp.stateStack.length - 1].node;
    const rawNodeKey = `${node.start}:${node.end}`;
    const nodeKey = destToSrcMap[rawNodeKey];
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
      break;
    }
  }
  console.log("DONE");
}

init();

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
  const ast1 = ast;
  const ast2 = acorn.parse(transpiled, { locations: true });

  function _getAllASTNodes (ast, nodes = []) {
    if (Array.isArray(ast)) {
      ast.forEach(n => _getAllASTNodes(n, nodes));
      return nodes;
    }
    if (!ast || !ast.type) {
      return nodes;
    }
    nodes.push(ast);
    Object.keys(ast).forEach(key => _getAllASTNodes(ast[key], nodes));
    return nodes;
  }

  const nodes1 = _getAllASTNodes(ast1);
  const nodes2 = _getAllASTNodes(ast2);

  const astLocationMap = new ASTLocationMap();
  nodes1.forEach(node => astLocationMap.addASTNode(node));

  const destNodesToSourceNodes = new Map();
  nodes2.forEach(n2 => {
    const destLoc = n2.loc.start;
    const srcLoc = sm.getSourceLocation(destLoc);
    const matchedN1 = astLocationMap.getMatchingNode(n2, srcLoc.line, srcLoc.column);
  });

}

// doCrossCompileSequence();
