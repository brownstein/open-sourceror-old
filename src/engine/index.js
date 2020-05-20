import {
  Box3,
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
    this.cameraSize = { width: 400, height: 400 };
    this.camera = new OrthographicCamera(
      -this.cameraSize.width / 2, this.cameraSize.width / 2,
      -this.cameraSize.height / 2, this.cameraSize.height / 2,
      -32, 32
    );
    this.camera.lookAt(new Vector3(0, 0, -1));
    this.camera.position.copy(new Vector3(0, 0, 1));
    this.levelBBox = new Box3();
    this.levelBBox.expandByPoint(new Vector3(0, 0, 0));
    this.levelBBox.expandByPoint(new Vector3(64, 64, 0));

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

    this.followingEntity = null;

    // window defocus pausing
    this.paused = false;
    window.onblur = () => {
      this.paused = true;
    };
    window.onfocus = () => {
      this.paused = false;
      this.lastFrameTime = new Date().getTime();
    };
  }
  addEntity (entity) {
    this.activeEntities.push(entity);
    this.activeEntitiesByBodyId[entity.body.id] = entity;
    this.world.addBody(entity.body);
    this.scene.add(entity.mesh);
  }
  addLevelEntity (entity) {
    // TODO revise room geometry
    this.activeEntities.push(entity);
    this.activeEntitiesByBodyId[entity.body.id] = entity;
    this.world.addBody(entity.body);
    this.scene.add(entity.mesh);
    this.levelBBox.expandByObject(entity.mesh);
  }
  followEntity (entity) {
    this.followingEntity = entity;
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
    if (this.paused) {
      requestAnimationFrame(this.onFrame);
      return;
    }
    // find time delta and update the p2 world
    const fixedTimeStep = 1 / 60; // seconds
    const maxSubSteps = 10; // Max sub steps to catch up with the wall clock
    const time = new Date().getTime();
    const rawDeltaTime = this.lastFrameTime ?
      time - this.lastFrameTime :
      0;
    const deltaTime = rawDeltaTime / 1000;
    this.lastFrameTime = time;
    this.world.step(fixedTimeStep, deltaTime, maxSubSteps);

    // sync everything with the physics engine
    this.activeEntities.forEach(e => {
      e.syncMeshWithBody && e.syncMeshWithBody(rawDeltaTime);
      e.runKeyboardMotion && e.runKeyboardMotion(this.ks);
      e.onFrame && e.onFrame(rawDeltaTime);
    });

    // run per-entity contact equation handlers
    const contactEquations = this.world.narrowphase.contactEquations;
    for (let eqi = 0; eqi < contactEquations.length; eqi++) {
      const eq = contactEquations[eqi];
      const entityA = this.activeEntitiesByBodyId[eq.bodyA.id];
      const entityB = this.activeEntitiesByBodyId[eq.bodyB.id];
      if (entityA && entityA.handleContactEquation) {
        entityA.handleContactEquation(eq, entityB);
      }
      if (entityB && entityB.handleContactEquation) {
        entityB.handleContactEquation(eq, entityA);
      }
    }

    // track camera
    if (this.followingEntity) {
      this.camera.position.x = Math.max(
        this.levelBBox.min.x + this.cameraSize.width / 2,
        Math.min(
          this.levelBBox.max.x - this.cameraSize.width / 2,
          this.followingEntity.mesh.position.x
        )
      );
      this.camera.position.y = Math.max(
        this.levelBBox.min.y + this.cameraSize.height / 2,
        Math.min(
          this.levelBBox.max.y - this.cameraSize.height / 2,
          this.followingEntity.mesh.position.y
        )
      );
    }

    // render the current frame
    this.renderer.render(this.scene, this.camera);

    // queue up next frame
    requestAnimationFrame(this.onFrame);
  }
}
