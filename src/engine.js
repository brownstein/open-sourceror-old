import {
  Color,
  OrthographicCamera,
  Scene,
  Vector3,
  Vector2,
  WebGLRenderer
} from "three";
import {
  ContactMaterial,
  World
} from "p2";

import KeyState from "./key-state";

export default class Engine {
  constructor() {
    // keyboard events
    this.ks = new KeyState();

    // rendering
    this.threeInitialized = false;
    this.renderEl = null;
    this.renderer = null;
    this.scene = new Scene();
    this.camera = new OrthographicCamera(
      -100, 600,
      -100, 600,
      -100, 100
    );
    this.camera.lookAt(new Vector3(0, 0, -1));
    this.camera.position.copy(new Vector3(0, 0, 1));

    // physics
    this.world = new World({
      gravity:[0, 900]
    });

    // bound animation method
    this.running = false;
    this.lastFrameTime = null;
    this.onFrame = this.onFrame.bind(this);

    // engine-level entities
    this.activeEntities = [];
    this.activeEntitiesByBodyId = {};
  }
  addEntity (entity) {
    this.activeEntities.push(entity);
    this.activeEntitiesByBodyId[entity.body.id] = entity;
    this.world.addBody(entity.body);
    this.scene.add(entity.mesh);
  }
  removeEntity (entity) {
    this.activeEntities = this.activeEntities.filter(e => e !== entity);
    delete this.activeEntitiesByBodyId[entity.body.id];
    this.world.removeBody(entity.body);
    this.scene.remove(entity.mesh);
  }
  initWithContainerElement(containerEl, options = null) {
    const _defaultWindowSize = { width: 400, height: 400 };
    const { windowSize = _defaultWindowSize } = options || {};

    // enable key tracking
    this.ks.mount(document);

    // initialize the webgl renderer
    this.renderEl = document.createElement("canvas");
    this.renderEl.style = `
      background: #cccccc;
      width: ${windowSize.width}px;
      height: ${windowSize.height}px;
    `;
    containerEl.appendChild(this.renderEl);

    this.renderer = new WebGLRenderer({
      // alpha: true,
      canvas: this.renderEl,
      preserveDrawingBuffer: true
    });
    this.renderer.setClearColor(new Color("#444444"));
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(windowSize.width, windowSize.height);
  }
  run() {
    if (this.running) {
      return;
    }
    this.running = true;
    requestAnimationFrame(this.onFrame);
  }
  onFrame() {
    if (!this.running) {
      return;
    }
    // find time delta and update the p2 world
    const fixedTimeStep = 1 / 60; // seconds
    const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
    const time = new Date().getTime();
    const deltaTime = this.lastFrameTime ?
      (time - this.lastFrameTime) / 1000 :
      0;
    this.lastFrameTime = time;
    this.world.step(fixedTimeStep, deltaTime, maxSubSteps);

    // sync everything with the physics engine
    this.activeEntities.forEach(e => {
      e.syncMeshWithBody && e.syncMeshWithBody();
      e.runKeyboardMotion && e.runKeyboardMotion(this.ks);
      e.onFrame && e.onFrame();
    });

    // run per-entity contact equation handlers
    this.world.narrowphase.contactEquations.forEach(eq => {
      const entityA = this.activeEntitiesByBodyId[eq.bodyA.id];
      const entityB = this.activeEntitiesByBodyId[eq.bodyB.id];
      if (entityA && entityA.handleContactEquation) {
        entityA.handleContactEquation(eq, entityB);
      }
      if (entityB && entityB.handleContactEquation) {
        entityB.handleContactEquation(eq, entityA);
      }
    });

    // render the current frame
    this.renderer.render(this.scene, this.camera);

    // queue up next frame
    requestAnimationFrame(this.onFrame);
  }
}
